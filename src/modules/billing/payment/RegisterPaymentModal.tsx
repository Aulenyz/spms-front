import {useEffect, useMemo, useState} from "react";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import ReactDOM from "react-dom";
import clsx from "clsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService, ReceiptService} from "../../../services/billing/BillingService.ts";
import {ProductService} from "../../../services/product/ProductService.ts";
import {Pagination} from "../../../domain/filters/Page.ts";
import {ProductStatus} from "../../../domain/model/product/Product.ts";
import {
    CheckoutResult,
    formatDate,
    money,
    NEEDS_REFERENCE,
    PaymentMethod,
    PaymentMethodIcon,
    PaymentMethodLabel,
    PersonRef,
} from "../../../domain/billing/Invoice.ts";
import {InvoiceStatusPill} from "../components/BillingPills.tsx";
import {StudentPicker} from "../components/StudentPicker.tsx";
import {printHtml, receiptHtml} from "../print/printDocuments.ts";
import {Guardian} from "../../../domain/student/Guardian.ts";
import {NewStudentForm} from "./NewStudentForm.tsx";
import {GuardiansStep} from "./GuardiansStep.tsx";

const invoiceService = InvoiceService.instance;
const SYSTEM_ONLY = ["ENROLLMENT", "RE_ENROLLMENT"];
const today = () => new Date().toISOString().slice(0, 10);
const round = (value: number) => Math.round(value * 100) / 100;

type Step = "STUDENT" | "GUARDIAN" | "CONCEPTS" | "REVIEW";
const STEPS: {id: Step; label: string; icon: string}[] = [
    {id: "STUDENT", label: "Estudiante", icon: "fa-id-card"},
    {id: "GUARDIAN", label: "Representante", icon: "fa-user-group"},
    {id: "CONCEPTS", label: "Conceptos", icon: "fa-receipt"},
    {id: "REVIEW", label: "Revisión", icon: "fa-clipboard-check"},
];

type CartLine = {key: string; productId: number; name: string; quantity: number; unitPrice: number};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    /** Estudiante ya elegido (desde su estado de cuenta o una factura). */
    student?: PersonRef | null;
    /** Factura pendiente que se marca al abrir. */
    invoiceId?: number;
};

const Label = ({children}: {children: string}) => (
    <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>{children}</span>
);

/**
 * Caja escolar: se elige el estudiante y quién paga, se agregan todos los conceptos que se quieran
 * (y las facturas pendientes que se pagan también) y se cobra en una sola operación.
 */
export const RegisterPaymentModal = ({isOpen, onClose, student: initialStudent, invoiceId}: Props) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<Step>("STUDENT");
    const [student, setStudent] = useState<PersonRef | null>(null);
    const [payer, setPayer] = useState<Guardian | undefined>();
    const [creatingStudent, setCreatingStudent] = useState(false);
    const [cart, setCart] = useState<CartLine[]>([]);
    const [pending, setPending] = useState<number[]>([]);
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [price, setPrice] = useState("");
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [reference, setReference] = useState("");
    const [date, setDate] = useState(today());
    const [notes, setNotes] = useState("");
    const [discount, setDiscount] = useState("0");
    const [received, setReceived] = useState<string | null>(null);
    const [result, setResult] = useState<CheckoutResult | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setStudent(initialStudent ?? null);
        setPending(invoiceId ? [invoiceId] : []);
        setStep(initialStudent ? "GUARDIAN" : "STUDENT");
    }, [isOpen, initialStudent, invoiceId]);

    const productsQuery = useQuery({
        queryKey: [...queryKeys.products.all, "checkout"],
        queryFn: ({signal}) => ProductService.instance.withSignal(signal).search({status: ProductStatus.ACTIVE}, {...Pagination.first, size: 100}),
        enabled: isOpen,
        meta: {errorMessage: "No se pudieron cargar los conceptos de pago."},
    });
    const products = useMemo(() => (productsQuery.data?.content ?? [])
        .filter((product) => !SYSTEM_ONLY.includes(product.systemKey ?? "")), [productsQuery.data]);

    const invoicesQuery = useQuery({
        queryKey: queryKeys.invoices.open(student?.id),
        queryFn: ({signal}) => invoiceService.withSignal(signal).open(student!.id),
        enabled: isOpen && Boolean(student),
        meta: {errorMessage: "No se pudieron cargar las facturas pendientes."},
    });
    const openInvoices = useMemo(() => [...(invoicesQuery.data?.content ?? [])]
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")), [invoicesQuery.data]);
    const owedBefore = round(openInvoices.reduce((sum, invoice) => sum + invoice.due, 0));

    const subtotal = round(cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
    const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
    const pendingTotal = round(openInvoices.filter((invoice) => pending.includes(invoice.id)).reduce((sum, invoice) => sum + invoice.due, 0));
    const total = round(subtotal - discountAmount + pendingTotal);
    const receivedAmount = received === null ? total : Math.max(0, Number(received) || 0);
    const balance = round(total - receivedAmount);
    const guardian = payer;
    const needsReference = NEEDS_REFERENCE.includes(method) && receivedAmount > 0 && !reference.trim();
    const overpaidByCard = balance < 0 && method !== PaymentMethod.CASH;

    const checkout = useMutation({
        mutationFn: () => ReceiptService.instance.checkout({
            studentId: student!.id, guardianId: payer!.id, method, date,
            reference: reference.trim() || undefined, notes: notes.trim() || undefined,
            discount: discountAmount || undefined,
            items: cart.map((line) => ({productId: line.productId, quantity: line.quantity, unitPrice: line.unitPrice})),
            invoiceIds: openInvoices.filter((invoice) => pending.includes(invoice.id)).map((invoice) => invoice.id),
            received: receivedAmount,
        }),
        onSuccess: (saved) => {
            setResult(saved);
            toast.success(saved.receipt ? `Cobro registrado. Recibo ${saved.receipt.receipt.number}.` : "Factura creada sin pago.");
            [queryKeys.invoices.all, queryKeys.payments.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo registrar el cobro."),
    });

    const reset = () => {
        setStep(initialStudent ? "GUARDIAN" : "STUDENT");
        setStudent(initialStudent ?? null);
        setPayer(undefined);
        setCreatingStudent(false);
        setCart([]);
        setPending(invoiceId ? [invoiceId] : []);
        setProductId("");
        setQuantity("1");
        setPrice("");
        setMethod(PaymentMethod.CASH);
        setReference("");
        setDate(today());
        setNotes("");
        setDiscount("0");
        setReceived(null);
        setResult(null);
    };

    const close = () => {
        reset();
        onClose();
    };

    const addToCart = (id: number, qty = 1, unitPrice?: number) => {
        const product = products.find((item) => item.id === id);
        if (!product) return;
        const amount = unitPrice ?? Number(product.price);
        if (!(amount > 0)) {
            toast.info(`Indica el precio de ${product.name}.`);
            return;
        }
        setCart((current) => {
            const existing = current.find((line) => line.productId === id && line.unitPrice === amount);
            return existing
                ? current.map((line) => line === existing ? {...line, quantity: line.quantity + qty} : line)
                : [...current, {key: `${id}-${Date.now()}`, productId: id, name: product.name, quantity: qty, unitPrice: amount}];
        });
        setReceived(null);
    };

    const addSelected = () => {
        if (!productId) return;
        addToCart(Number(productId), Math.max(1, Number(quantity) || 1), Number(price) > 0 ? Number(price) : undefined);
        setProductId("");
        setQuantity("1");
        setPrice("");
    };

    const canContinue = (target: Step) => {
        if (target === "STUDENT") return true;
        if (!student) return false;
        if (target === "GUARDIAN") return true;
        if (!payer) return false;
        if (target === "CONCEPTS") return true;
        return total > 0 && !needsReference && !overpaidByCard;
    };
    const currentIndex = STEPS.findIndex((item) => item.id === step);
    const next = STEPS[currentIndex + 1]?.id;

    if (!isOpen) return null;

    const preview = (
        <aside className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{color: "var(--text-tertiary)"}}>Vista previa</p>
                    <p className="text-base font-extrabold" style={{color: "var(--text-primary)"}}>Recibo de pago</p>
                </div>
                <span className="rounded-xl px-3 py-1.5 text-xs font-semibold" style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                    {formatDate(date)}
                </span>
            </div>

            <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-2xl px-3 py-3" style={{background: "var(--surface-muted)"}}>
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>Estudiante</p>
                    {student ? (
                        <>
                            <p className="mt-1 font-semibold" style={{color: "var(--text-primary)"}}>{student.name}</p>
                            <p className="text-xs" style={{color: "var(--text-secondary)"}}>{student.document} · debe {money.format(owedBefore)}</p>
                        </>
                    ) : <p className="mt-1" style={{color: "var(--text-tertiary)"}}>Sin seleccionar</p>}
                </div>
                <div className="rounded-2xl px-3 py-3" style={{background: "var(--surface-muted)"}}>
                    <p className="text-[11px] uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>Paga</p>
                    <p className="mt-1 font-semibold" style={{color: "var(--text-primary)"}}>
                        {guardian ? `${guardian.firstname} ${guardian.lastname}` : "—"}
                    </p>
                    <p className="text-xs" style={{color: "var(--text-secondary)"}}>
                        <i className={`fa ${PaymentMethodIcon[method]} me-1`}/>{PaymentMethodLabel[method]}{reference && ` · Ref. ${reference}`}
                    </p>
                </div>
                <div className="rounded-2xl px-3 py-3" style={{background: "var(--surface-muted)"}}>
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>
                        <span>Conceptos</span><span className="font-semibold">{cart.length + pending.length}</span>
                    </div>
                    {cart.length + pending.length === 0 ? (
                        <p className="mt-2" style={{color: "var(--text-tertiary)"}}>Sin conceptos</p>
                    ) : (
                        <div className="mt-2 space-y-1.5">
                            {cart.map((line) => (
                                <div key={line.key} className="flex justify-between gap-3">
                                    <span className="truncate" style={{color: "var(--text-primary)"}}>{line.quantity > 1 && `${line.quantity} × `}{line.name}</span>
                                    <span className="font-semibold" style={{color: "var(--text-primary)"}}>{money.format(line.quantity * line.unitPrice)}</span>
                                </div>
                            ))}
                            {openInvoices.filter((invoice) => pending.includes(invoice.id)).map((invoice) => (
                                <div key={invoice.id} className="flex justify-between gap-3">
                                    <span className="truncate" style={{color: "var(--text-primary)"}}>{invoice.description || invoice.number}
                                        <span className="ms-1 text-xs" style={{color: "var(--text-tertiary)"}}>({invoice.number})</span></span>
                                    <span className="font-semibold" style={{color: "var(--text-primary)"}}>{money.format(invoice.due)}</span>
                                </div>
                            ))}
                            {discountAmount > 0 && (
                                <div className="flex justify-between gap-3" style={{color: "var(--success)"}}>
                                    <span>Descuento</span><span>−{money.format(discountAmount)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="rounded-2xl bg-slate-900 px-3 py-3 text-white">
                    <div className="flex items-center justify-between">
                        <span className="text-white/70">Total</span>
                        <span className="text-lg font-black">{money.format(total)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                        <span>Recibido</span><span className="font-semibold text-white">{money.format(receivedAmount)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-white/70">
                        <span>{balance > 0 ? "Queda pendiente" : balance < 0 ? "Devuelta" : "Balance"}</span>
                        <span className="font-semibold text-white">{money.format(Math.abs(balance))}</span>
                    </div>
                </div>
            </div>
        </aside>
    );

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-950/60 backdrop-blur-sm">
            <button type="button" aria-label="Cerrar" onClick={close} className="absolute inset-0 h-full w-full cursor-default"/>

            <section role="dialog" aria-modal="true" aria-labelledby="register-payment-title"
                     className="relative flex h-full w-full max-w-[1280px] flex-col border-l lg:w-[80vw]"
                     style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                <header className="flex items-start justify-between gap-4 border-b px-5 py-4 lg:px-6"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                    <div className="space-y-2">
                        <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                              style={{background: "var(--success-soft)", color: "var(--success)"}}>Caja escolar</span>
                        <h2 id="register-payment-title" className="text-xl font-extrabold lg:text-2xl" style={{color: "var(--text-primary)"}}>Registrar pago</h2>
                        <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                            Agrega todos los conceptos que quieras y las facturas pendientes que se pagan; se cobra todo junto.
                        </p>
                    </div>
                    <button type="button" onClick={close} aria-label="Cerrar" className="row-action"><i className="fa fa-times"/></button>
                </header>

                {result ? (
                    <div className="flex flex-1 items-center justify-center p-6">
                        <div className="w-full max-w-md space-y-5 rounded-[22px] border p-6 text-center"
                             style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl"
                                  style={{background: "var(--success-soft)", color: "var(--success)"}}><i className="fa fa-check"/></span>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold" style={{color: "var(--text-primary)"}}>
                                    {result.receipt ? `Recibo ${result.receipt.receipt.number} por ${money.format(result.receipt.receipt.amount)}` : "Factura creada sin pago"}
                                </h3>
                                {result.invoice && (
                                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                                        Factura {result.invoice.invoice.number} por {money.format(result.invoice.invoice.total)}
                                        {result.invoice.invoice.due > 0 && ` · queda ${money.format(result.invoice.invoice.due)} pendiente`}
                                    </p>
                                )}
                                {result.change > 0 && (
                                    <p className="text-base font-bold" style={{color: "var(--success)"}}>Devuelta: {money.format(result.change)}</p>
                                )}
                            </div>
                            <div className="flex justify-center gap-2">
                                <button type="button" className="btn btn-sm" onClick={reset}>Nuevo cobro</button>
                                {result.receipt ? (
                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => printHtml(receiptHtml(result.receipt!))}>
                                        <i className="fa fa-print"/>Imprimir recibo
                                    </button>
                                ) : result.invoice && (
                                    <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/invoices/${result.invoice.invoice.id}`} className="btn btn-sm btn-primary" onClick={close}>Ver factura</PermittedLink>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-6">
                            <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                                <div className="space-y-4">
                                    <ol className="flex gap-3 overflow-x-auto pb-1">
                                        {STEPS.map((item, index) => {
                                            const active = item.id === step;
                                            const done = index < currentIndex;
                                            return (
                                                <li key={item.id} className="shrink-0">
                                                    <button type="button" disabled={!canContinue(item.id) && index > currentIndex}
                                                            onClick={() => setStep(item.id)}
                                                            className={clsx("flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:opacity-60",
                                                                active ? "border-slate-900 bg-slate-900 text-white" : "")}
                                                            style={active ? undefined : {borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                                        <span className={clsx("flex h-9 w-9 items-center justify-center rounded-xl text-xs",
                                                            done ? "bg-emerald-500 text-white" : active ? "bg-white/10 text-white" : "")}
                                                              style={done || active ? undefined : {background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                                            <i className={`fa ${done ? "fa-check" : item.icon}`}/>
                                                        </span>
                                                        <span>
                                                            <strong className="block text-sm" style={active ? undefined : {color: "var(--text-primary)"}}>{index + 1}. {item.label}</strong>
                                                            <span className={clsx("text-xs", active ? "text-white/70" : "")} style={active ? undefined : {color: "var(--text-tertiary)"}}>
                                                                {done ? "Completado" : active ? "En curso" : "Pendiente"}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>

                                    <section className="rounded-[22px] border p-5" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                        {step === "STUDENT" && (
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <h3 className="text-base font-bold" style={{color: "var(--text-primary)"}}>¿A quién se le cobra?</h3>
                                                    {!creatingStudent && (
                                                        <button type="button" className="btn btn-sm" onClick={() => setCreatingStudent(true)}>
                                                            <i className="fa fa-user-plus"/>Registrar estudiante nuevo
                                                        </button>
                                                    )}
                                                </div>
                                                {creatingStudent ? (
                                                    <NewStudentForm onCancel={() => setCreatingStudent(false)} onCreated={(created) => {
                                                        setCreatingStudent(false);
                                                        setStudent(created);
                                                        setPayer(undefined);
                                                        setPending([]);
                                                        setReceived(null);
                                                        setStep("GUARDIAN");
                                                    }}/>
                                                ) : (
                                                    <StudentPicker value={student} onChange={(value) => {
                                                        setStudent(value);
                                                        setPayer(undefined);
                                                        setPending([]);
                                                        setReceived(null);
                                                    }}/>
                                                )}
                                                {student && !creatingStudent && (
                                                    <p className="rounded-xl px-4 py-3 text-sm" style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                                        {openInvoices.length > 0
                                                            ? <>Tiene <strong>{openInvoices.length}</strong> {openInvoices.length === 1 ? "factura pendiente" : "facturas pendientes"} por <strong>{money.format(owedBefore)}</strong>.</>
                                                            : "Está al día: no tiene facturas pendientes."}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {step === "GUARDIAN" && student && (
                                            <GuardiansStep student={student} payerId={payer?.id} onPayer={setPayer}/>
                                        )}

                                        {step === "CONCEPTS" && (
                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <h3 className="text-base font-bold" style={{color: "var(--text-primary)"}}>Conceptos</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {products.filter((product) => Number(product.price) > 0).map((product) => (
                                                            <button key={product.id} type="button" onClick={() => addToCart(product.id)}
                                                                    className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                                                                    style={{borderColor: "var(--border-soft)", color: "var(--text-secondary)", background: "var(--surface)"}}>
                                                                + {product.name} · {money.format(Number(product.price))}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid gap-2 sm:grid-cols-[1fr_80px_130px_auto]">
                                                        <select className="select select-bordered select-sm w-full" value={productId} aria-label="Concepto"
                                                                onChange={(event) => {
                                                                    setProductId(event.target.value);
                                                                    const product = products.find((item) => item.id === Number(event.target.value));
                                                                    setPrice(product && Number(product.price) > 0 ? String(product.price) : "");
                                                                }}>
                                                            <option value="">Otro concepto…</option>
                                                            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                                                        </select>
                                                        <input type="number" min={1} className="input input-bordered input-sm text-right" aria-label="Cantidad"
                                                               value={quantity} onChange={(event) => setQuantity(event.target.value)}/>
                                                        <input type="number" min={0} step="0.01" className="input input-bordered input-sm text-right" aria-label="Precio"
                                                               placeholder="Precio" value={price} onChange={(event) => setPrice(event.target.value)}/>
                                                        <button type="button" className="btn btn-sm" disabled={!productId} onClick={addSelected}>
                                                            <i className="fa fa-plus"/>Agregar
                                                        </button>
                                                    </div>
                                                    {cart.length === 0 ? (
                                                        <p className="rounded-2xl border border-dashed p-4 text-center text-sm"
                                                           style={{borderColor: "var(--border-soft)", color: "var(--text-tertiary)"}}>
                                                            Agrega conceptos con los botones de arriba, o marca facturas pendientes abajo.
                                                        </p>
                                                    ) : (
                                                        <ul className="divide-y rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                                                            {cart.map((line) => (
                                                                <li key={line.key} className="flex items-center gap-3 px-4 py-2.5">
                                                                    <span className="min-w-0 flex-1">
                                                                        <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{line.name}</strong>
                                                                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>{money.format(line.unitPrice)} c/u</span>
                                                                    </span>
                                                                    <input type="number" min={1} className="input input-bordered input-xs w-16 text-right" aria-label={`Cantidad de ${line.name}`}
                                                                           value={line.quantity}
                                                                           onChange={(event) => {
                                                                               const value = Math.max(1, Number(event.target.value) || 1);
                                                                               setCart((current) => current.map((item) => item.key === line.key ? {...item, quantity: value} : item));
                                                                               setReceived(null);
                                                                           }}/>
                                                                    <strong className="w-28 text-right text-sm" style={{color: "var(--text-primary)"}}>{money.format(line.quantity * line.unitPrice)}</strong>
                                                                    <button type="button" className="row-action" aria-label={`Quitar ${line.name}`}
                                                                            onClick={() => {
                                                                                setCart((current) => current.filter((item) => item.key !== line.key));
                                                                                setReceived(null);
                                                                            }}>
                                                                        <i className="fa fa-trash"/>
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {openInvoices.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-bold" style={{color: "var(--text-primary)"}}>Facturas pendientes</h4>
                                                        <ul className="divide-y rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                                                            {openInvoices.map((invoice) => (
                                                                <li key={invoice.id}>
                                                                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                                                                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                                                                               checked={pending.includes(invoice.id)}
                                                                               onChange={(event) => {
                                                                                   setPending((current) => event.target.checked ? [...current, invoice.id] : current.filter((id) => id !== invoice.id));
                                                                                   setReceived(null);
                                                                               }}/>
                                                                        <span className="min-w-0 flex-1">
                                                                            <span className="flex flex-wrap items-center gap-2">
                                                                                <strong className="text-sm" style={{color: "var(--text-primary)"}}>{invoice.description || invoice.number}</strong>
                                                                                <InvoiceStatusPill status={invoice.status}/>
                                                                            </span>
                                                                            <span className="text-xs" style={{color: "var(--text-tertiary)"}}>{invoice.number} · vence {formatDate(invoice.dueDate)}</span>
                                                                        </span>
                                                                        <strong className="text-sm" style={{color: "var(--text-primary)"}}>{money.format(invoice.due)}</strong>
                                                                    </label>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-bold" style={{color: "var(--text-primary)"}}>Pago</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.values(PaymentMethod).map((value) => (
                                                            <button key={value} type="button" onClick={() => setMethod(value)}
                                                                    className={`btn btn-sm ${method === value ? "btn-primary" : ""}`}>
                                                                <i className={`fa ${PaymentMethodIcon[value]}`}/>{PaymentMethodLabel[value]}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                        <label className="block"><Label>Descuento</Label>
                                                            <input type="number" min={0} step="0.01" className="input input-bordered input-sm w-full text-right"
                                                                   value={discount} disabled={cart.length === 0}
                                                                   onChange={(event) => {
                                                                       setDiscount(event.target.value);
                                                                       setReceived(null);
                                                                   }}/>
                                                        </label>
                                                        <label className="block"><Label>Recibido</Label>
                                                            <input type="number" min={0} step="0.01" className="input input-bordered input-sm w-full text-right"
                                                                   value={received ?? String(total)} onChange={(event) => setReceived(event.target.value)}/>
                                                        </label>
                                                        <label className="block"><Label>{NEEDS_REFERENCE.includes(method) ? "Referencia*" : "Referencia"}</Label>
                                                            <input className="input input-bordered input-sm w-full" maxLength={128} value={reference}
                                                                   placeholder={NEEDS_REFERENCE.includes(method) ? "N.º transferencia o cheque" : "Opcional"}
                                                                   onChange={(event) => setReference(event.target.value)}/>
                                                        </label>
                                                        <label className="block"><Label>Fecha</Label>
                                                            <input type="date" className="input input-bordered input-sm w-full" value={date} max={today()}
                                                                   onChange={(event) => setDate(event.target.value)}/>
                                                        </label>
                                                        <label className="block sm:col-span-2 xl:col-span-4"><Label>Nota</Label>
                                                            <input className="input input-bordered input-sm w-full" maxLength={500} value={notes}
                                                                   placeholder="Opcional" onChange={(event) => setNotes(event.target.value)}/>
                                                        </label>
                                                    </div>
                                                    {overpaidByCard && (
                                                        <p className="text-sm" style={{color: "var(--danger)"}}>
                                                            <i className="fa fa-triangle-exclamation me-2"/>Solo en efectivo se puede recibir más del total (para dar devuelta).
                                                        </p>
                                                    )}
                                                    {balance > 0 && receivedAmount > 0 && (
                                                        <p className="text-xs" style={{color: "var(--text-secondary)"}}>
                                                            Pago parcial: quedarán {money.format(balance)} pendientes en su estado de cuenta.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {step === "REVIEW" && (
                                            <div className="space-y-4">
                                                <h3 className="text-base font-bold" style={{color: "var(--text-primary)"}}>Revisa antes de cobrar</h3>
                                                <ul className="space-y-2 text-sm" style={{color: "var(--text-secondary)"}}>
                                                    <li><i className="fa fa-id-card me-2"/>{student?.name}{guardian && ` · paga ${guardian.firstname} ${guardian.lastname}`}</li>
                                                    {cart.length > 0 && <li><i className="fa fa-file-invoice-dollar me-2"/>Se crea una factura por {money.format(subtotal - discountAmount)} con {cart.length} {cart.length === 1 ? "concepto" : "conceptos"}{discountAmount > 0 && ` (descuento ${money.format(discountAmount)})`}.</li>}
                                                    {pending.length > 0 && <li><i className="fa fa-clock-rotate-left me-2"/>Se pagan {pending.length} {pending.length === 1 ? "factura pendiente" : "facturas pendientes"} por {money.format(pendingTotal)}.</li>}
                                                    <li><i className={`fa ${PaymentMethodIcon[method]} me-2`}/>{receivedAmount > 0 ? `Se reciben ${money.format(receivedAmount)} en ${PaymentMethodLabel[method].toLowerCase()}.` : "No se recibe dinero: todo queda pendiente."}</li>
                                                    {balance > 0 && receivedAmount > 0 && <li style={{color: "var(--warning)"}}><i className="fa fa-hourglass-half me-2"/>Quedan {money.format(balance)} pendientes.</li>}
                                                    {balance < 0 && <li style={{color: "var(--success)"}}><i className="fa fa-coins me-2"/>Devuelta: {money.format(-balance)}.</li>}
                                                </ul>
                                            </div>
                                        )}
                                    </section>
                                </div>

                                {preview}
                            </div>
                        </div>

                        <footer className="flex items-center justify-end gap-3 border-t px-5 py-3 lg:px-6"
                                style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            {step === "GUARDIAN" && !payer && (
                                <span className="me-auto text-xs" style={{color: "var(--text-tertiary)"}}>Agrega o elige el representante que paga para continuar.</span>
                            )}
                            {next ? (
                                <button type="button" className="btn btn-sm btn-primary" disabled={!canContinue(next)} onClick={() => setStep(next)}>
                                    Continuar<i className="fa fa-arrow-right"/>
                                </button>
                            ) : (
                                <button type="button" className="btn btn-sm btn-primary" disabled={!canContinue("REVIEW") || checkout.isPending}
                                        onClick={() => checkout.mutate()}>
                                    {checkout.isPending ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-check"/>}
                                    {receivedAmount > 0 ? `Cobrar ${money.format(Math.min(receivedAmount, total))}` : "Crear factura sin pago"}
                                </button>
                            )}
                        </footer>
                    </>
                )}
            </section>
        </div>,
        document.body,
    );
};
