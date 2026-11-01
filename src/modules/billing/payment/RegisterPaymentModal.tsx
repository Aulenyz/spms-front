import {useEffect, useMemo, useState} from "react";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import ReactDOM from "react-dom";
import clsx from "clsx";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService, ReceiptService, UpcomingCharge} from "../../../services/billing/BillingService.ts";
import {AssistantService} from "../../../services/assistant/AssistantService.ts";
import {ProductService} from "../../../services/product/ProductService.ts";
import {Pagination} from "../../../domain/filters/Page.ts";
import {Product, ProductStatus, RecurrenceType} from "../../../domain/model/product/Product.ts";
import {CheckoutResult, formatDate, localToday, money, NEEDS_REFERENCE, PaymentMethod, PaymentMethodIcon, PaymentMethodLabel, PersonRef, invoiceLink} from "../../../domain/billing/Invoice.ts";
import {InvoiceStatusPill} from "../components/BillingPills.tsx";
import {StudentPicker} from "../components/StudentPicker.tsx";
import {printHtml, receiptHtml} from "../print/printDocuments.ts";
import {Guardian} from "../../../domain/student/Guardian.ts";
import {NewStudentForm} from "./NewStudentForm.tsx";
import {courseLabel, CourseSearchSelect} from "../../../components/io/input/business/CourseSearchSelect.tsx";
import {Course} from "../../../domain/model/course/Course.ts";
import {EnrollmentService} from "../../../services/student/enrollment/EnrollmentService.ts";
import {GuardiansStep} from "./GuardiansStep.tsx";

const invoiceService = InvoiceService.instance;
const SYSTEM_ONLY = ["ENROLLMENT", "RE_ENROLLMENT"];
const today = localToday;
const round = (value: number) => Math.round(value * 100) / 100;
/** Concepto que se cobra cada periodo (mensualidad, transporte…): se paga por periodos, no por cantidad. */
const isPeriodic = (product?: Product) => Boolean(product?.chargeMode && product.chargeMode !== RecurrenceType.NONE);

type Step = "STUDENT" | "GUARDIAN" | "CONCEPTS" | "REVIEW";
const STEPS: {id: Step; label: string; icon: string}[] = [
    {id: "STUDENT", label: "Estudiante", icon: "fa-id-card"},
    {id: "GUARDIAN", label: "Representante", icon: "fa-user-group"},
    {id: "CONCEPTS", label: "Conceptos", icon: "fa-receipt"},
    {id: "REVIEW", label: "Revisión", icon: "fa-clipboard-check"},
];

/** Una línea del cobro. Si el concepto es periódico, `upcoming` son sus periodos por cobrar y `quantity` cuántos se pagan. */
type CartLine = {key: string; productId: number; name: string; quantity: number; unitPrice: number; upcoming?: UpcomingCharge[]};

/** Lo que cubre cada línea, como se verá en la factura: "Mensualidad octubre 2026" por cada periodo. */
const lineDescriptions = (line: CartLine) => line.upcoming
    ? line.upcoming.slice(0, line.quantity).map((period) => period.description)
    : [line.quantity > 1 ? `${line.quantity} × ${line.name}` : line.name];

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
    const [enrollCourse, setEnrollCourse] = useState<Course | null>(null);
    const [choosingCourse, setChoosingCourse] = useState(false);
    const [productId, setProductId] = useState("");
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [reference, setReference] = useState("");
    const [date, setDate] = useState(today());
    const [notes, setNotes] = useState("");
    // La nota la escribe la IA al llegar a Revisión; si el cajero la edita, ya no se reemplaza sola.
    const [noteByHand, setNoteByHand] = useState(false);
    const [noteFor, setNoteFor] = useState("");
    const [writingNote, setWritingNote] = useState(false);
    const [discount, setDiscount] = useState("0");
    const [received, setReceived] = useState<string | null>(null);
    const [result, setResult] = useState<CheckoutResult | null>(null);

    // Solo al abrir (o si cambia el estudiante de origen): un objeto nuevo del mismo estudiante no reinicia el cobro.
    const initialStudentId = initialStudent?.id;
    useEffect(() => {
        if (!isOpen) return;
        setStudent(initialStudent ?? null);
        setPending(invoiceId ? [invoiceId] : []);
        setStep(initialStudent ? "GUARDIAN" : "STUDENT");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialStudentId, invoiceId]);

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

    // La inscripción va primero: sin inscripción en el periodo no se pueden agregar otros conceptos.
    const standingQuery = useQuery({
        queryKey: [...queryKeys.enrollments.all, "standing", student?.id ?? null],
        queryFn: ({signal}) => EnrollmentService.instance.withSignal(signal).standing(student!.id),
        enabled: isOpen && Boolean(student),
        meta: {errorMessage: "No se pudo consultar la inscripción del estudiante."},
    });
    const standing = standingQuery.data;
    const notEnrolled = standing?.state === "NOT_ENROLLED";
    const pendingEnrollmentInvoice = standing?.state === "PENDING" ? standing.invoiceId : undefined;
    const conceptsLocked = notEnrolled && !enrollCourse;
    const enrollmentAmount = notEnrolled && enrollCourse ? round(Number(standing?.conceptPrice ?? 0)) : 0;
    // La inscripción puede costar 0: se inscribe igual, sin cobro.
    const enrolling = notEnrolled && Boolean(enrollCourse);
    const enrollmentPriceSet = standing?.conceptPrice != null && Number(standing.conceptPrice) >= 0;
    const enrollmentPriceLabel = Number(standing?.conceptPrice ?? 0) > 0 ? money.format(Number(standing?.conceptPrice)) : "Sin costo";
    useEffect(() => {
        if (pendingEnrollmentInvoice) setPending((current) => current.includes(pendingEnrollmentInvoice) ? current : [pendingEnrollmentInvoice, ...current]);
    }, [pendingEnrollmentInvoice]);

    const subtotal = round(cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
    const discountAmount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
    const pendingTotal = round(openInvoices.filter((invoice) => pending.includes(invoice.id)).reduce((sum, invoice) => sum + invoice.due, 0));
    const total = round(enrollmentAmount + subtotal - discountAmount + pendingTotal);
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
            items: cart.map((line) => ({productId: line.productId, quantity: line.quantity})),
            invoiceIds: openInvoices.filter((invoice) => pending.includes(invoice.id)).map((invoice) => invoice.id),
            enrollCourseId: notEnrolled && enrollCourse ? enrollCourse.id : undefined,
            received: receivedAmount,
        }),
        onSuccess: (saved) => {
            setResult(saved);
            toast.success(saved.receipt ? `Cobro registrado. Recibo ${saved.receipt.receipt.number}.`
                : saved.invoice ? "Factura creada sin pago." : "Inscripción registrada sin costo.");
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
        setEnrollCourse(null);
        setChoosingCourse(false);
        setProductId("");
        setMethod(PaymentMethod.CASH);
        setReference("");
        setDate(today());
        setNotes("");
        setNoteByHand(false);
        setNoteFor("");
        setDiscount("0");
        setReceived(null);
        setResult(null);
    };

    const close = () => {
        reset();
        onClose();
    };

    // Un concepto periódico agrega el siguiente periodo por cobrar; uno único suma una unidad. El precio
    // es el del concepto: se cambia en Conceptos de pago, no en la caja.
    const addToCart = async (id: number) => {
        const product = products.find((item) => item.id === id);
        if (!product || !student) return;
        const amount = Number(product.price);
        if (!(amount > 0)) {
            toast.info(`${product.name} no tiene precio. Configúralo en Conceptos de pago.`);
            return;
        }
        const existing = cart.find((line) => line.productId === id && line.unitPrice === amount);
        if (isPeriodic(product)) {
            if (existing?.upcoming) return changePeriods(existing, existing.quantity + 1);
            let upcoming: UpcomingCharge[];
            try {
                upcoming = await invoiceService.upcoming(student.id, id);
            } catch {
                toast.error(`No se pudieron consultar los periodos de ${product.name}.`);
                return;
            }
            if (upcoming.length === 0) {
                toast.info(`${product.name} ya está cobrado hasta el final del periodo.`);
                return;
            }
            setCart((current) => [...current, {key: `${id}-${Date.now()}`, productId: id, name: product.name, quantity: 1, unitPrice: amount, upcoming}]);
        } else {
            setCart((current) => existing
                ? current.map((line) => line === existing ? {...line, quantity: line.quantity + 1} : line)
                : [...current, {key: `${id}-${Date.now()}`, productId: id, name: product.name, quantity: 1, unitPrice: amount}]);
        }
        setReceived(null);
    };

    // Cuántos periodos se pagan: de 1 hasta los que quedan en el periodo escolar.
    const changePeriods = (line: CartLine, periods: number) => {
        const max = line.upcoming?.length ?? 1;
        if (periods > max) toast.info(`De ${line.name} solo ${max === 1 ? "queda 1 periodo" : `quedan ${max} periodos`} por cobrar.`);
        const value = Math.min(max, Math.max(1, periods));
        setCart((current) => current.map((item) => item.key === line.key ? {...item, quantity: value} : item));
        setReceived(null);
    };

    const addSelected = () => {
        if (!productId) return;
        void addToCart(Number(productId));
        setProductId("");
    };

    // Lo que cubre el cobro, sin nombres de personas: es lo que lee la IA para escribir la nota.
    const noteInput = {
        concepts: [
            ...(enrolling && standing?.conceptName ? [standing.conceptName] : []),
            ...cart.flatMap(lineDescriptions),
        ],
        invoices: openInvoices.filter((invoice) => pending.includes(invoice.id)).map((invoice) => invoice.description || invoice.number),
        method: PaymentMethodLabel[method],
        discount: discountAmount > 0,
        partial: balance > 0 && receivedAmount > 0,
    };
    const noteKey = JSON.stringify(noteInput);

    const writeNote = async () => {
        setWritingNote(true);
        try {
            const {note} = await AssistantService.instance.paymentNote({...noteInput, method});
            setNotes(note);
            setNoteByHand(false);
            setNoteFor(noteKey);
        } catch {
            // Sin IA, la nota se escribe a mano.
        } finally {
            setWritingNote(false);
        }
    };

    const {data: assistant} = useQuery({
        queryKey: ["assistant", "status"],
        queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(),
        enabled: isOpen,
        staleTime: Infinity,
        meta: {silent: true},
    });
    useEffect(() => {
        if (step !== "REVIEW" || !assistant?.enabled || noteByHand || noteFor === noteKey || writingNote) return;
        if (noteInput.concepts.length === 0 && noteInput.invoices.length === 0) return;
        void writeNote();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, assistant?.enabled, noteByHand, noteFor, noteKey]);

    const canContinue = (target: Step) => {
        if (target === "STUDENT") return true;
        if (!student) return false;
        // Sin inscripción en el periodo, el curso se elige en el paso 1 (inscripción y pago van juntos)
        if (standingQuery.isPending) return false;
        if (target === "GUARDIAN") return true;
        if (!payer) return false;
        if (target === "CONCEPTS") return true;
        // Sin inscripción, el curso se elige en Conceptos y la inscripción entra como primera línea
        if (notEnrolled && !enrollCourse) return false;
        // Una inscripción sin costo se puede registrar aunque el total sea 0
        return (total > 0 || enrolling) && !needsReference && !overpaidByCard;
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
                        <span>Conceptos</span><span className="font-semibold">{cart.length + pending.length + (enrolling ? 1 : 0)}</span>
                    </div>
                    {cart.length + pending.length + (enrolling ? 1 : 0) === 0 ? (
                        <p className="mt-2" style={{color: "var(--text-tertiary)"}}>Sin conceptos</p>
                    ) : (
                        <div className="mt-2 space-y-1.5">
                            {enrolling && enrollCourse && (
                                <div className="flex justify-between gap-3">
                                    <span className="truncate" style={{color: "var(--text-primary)"}}>{standing?.conceptName}
                                        <span className="ms-1 text-xs" style={{color: "var(--text-tertiary)"}}>({[enrollCourse.name, enrollCourse.division].filter(Boolean).join(" ")})</span></span>
                                    <span className="font-semibold" style={{color: "var(--text-primary)"}}>{enrollmentAmount > 0 ? money.format(enrollmentAmount) : "Sin costo"}</span>
                                </div>
                            )}
                            {cart.map((line) => (
                                <div key={line.key} className="flex justify-between gap-3">
                                    <span className="truncate" style={{color: "var(--text-primary)"}}>{lineDescriptions(line).join(", ")}</span>
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
                                    {result.receipt ? `Recibo ${result.receipt.receipt.number} por ${money.format(result.receipt.receipt.amount)}`
                                        : result.invoice ? "Factura creada sin pago" : "Inscripción registrada sin costo"}
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
                                    <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={invoiceLink(result.invoice.invoice.number)} className="btn btn-sm btn-primary" onClick={close}>Ver factura</PermittedLink>
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
                                                        setEnrollCourse(null);
                                                        setChoosingCourse(false);
                                                        setReceived(null);
                                                    }}/>
                                                ) : (
                                                    <StudentPicker value={student} onChange={(value) => {
                                                        setStudent(value);
                                                        setPayer(undefined);
                                                        setPending([]);
                                                        setEnrollCourse(null);
                                                        setChoosingCourse(false);
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
                                                {student && !creatingStudent && notEnrolled && (
                                                    <p className="rounded-xl px-4 py-3 text-sm" style={{background: "var(--warning-soft)", color: "var(--text-primary)"}}>
                                                        <i className="fa fa-user-clock me-2" style={{color: "var(--warning)"}}/>
                                                        No está inscrito en <strong>{standing?.periodName}</strong>: en Conceptos eliges el curso y se inscribe en este mismo pago.
                                                    </p>
                                                )}
                                                {student && !creatingStudent && standing?.state === "PENDING" && (
                                                    <p className="rounded-xl px-4 py-3 text-sm" style={{background: "var(--warning-soft)", color: "var(--text-primary)"}}>
                                                        <i className="fa fa-user-clock me-2" style={{color: "var(--warning)"}}/>
                                                        Inscrito en {standing.courseName}, pendiente de pago: {standing.invoiceNumber} se cobra primero.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {step === "GUARDIAN" && student && (
                                            <GuardiansStep student={student} payerId={payer?.id} onPayer={setPayer}/>
                                        )}

                                        {step === "CONCEPTS" && (
                                            <div className="space-y-6">
                                                {notEnrolled && (
                                                    <div className="space-y-2 rounded-2xl border p-4"
                                                         style={{borderColor: enrollCourse ? "var(--success)" : "var(--warning)", background: enrollCourse ? "var(--success-soft)" : "var(--warning-soft)"}}>
                                                        <p className="text-sm" style={{color: "var(--text-primary)"}}>
                                                            <i className={`fa ${enrollCourse ? "fa-circle-check" : "fa-user-clock"} me-2`}
                                                               style={{color: enrollCourse ? "var(--success)" : "var(--warning)"}}/>
                                                            {enrollCourse
                                                                ? <>{standing?.conceptName} agregada: se inscribe en este pago ({standing?.periodName}){Number(standing?.conceptPrice ?? 0) > 0 ? " y se cobra primero" : ", sin costo"}.</>
                                                                : <>No está inscrito en <strong>{standing?.periodName}</strong>. Elige el curso: la {(standing?.conceptName ?? "inscripción").toLowerCase()} se agrega sola como primer concepto.</>}
                                                        </p>
                                                        {enrollmentPriceSet ? (
                                                            enrollCourse ? (
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <span className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold"
                                                                          style={{borderColor: "var(--success)", background: "var(--surface)", color: "var(--text-primary)"}}>
                                                                        <i className="fa fa-graduation-cap" style={{color: "var(--success)"}}/>{courseLabel(enrollCourse)}
                                                                    </span>
                                                                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => {
                                                                        setEnrollCourse(null);
                                                                        setChoosingCourse(true);
                                                                    }}>Cambiar</button>
                                                                    <strong className="ms-auto whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>
                                                                        {standing?.conceptName} · {enrollmentPriceLabel}
                                                                    </strong>
                                                                </div>
                                                            ) : choosingCourse ? (
                                                                <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
                                                                    <label className="block">
                                                                        <span className="form-label mb-1 block text-sm font-semibold">Curso para la inscripción*</span>
                                                                        <CourseSearchSelect value={enrollCourse} onChange={(course) => {
                                                                            setEnrollCourse(course);
                                                                            setChoosingCourse(false);
                                                                            setReceived(null);
                                                                        }}/>
                                                                    </label>
                                                                    <button type="button" className="btn btn-sm" onClick={() => setChoosingCourse(false)}>Cancelar</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <button type="button" className="btn btn-sm btn-primary" onClick={() => setChoosingCourse(true)}>
                                                                        <i className="fa fa-graduation-cap"/>Curso para la inscripción
                                                                    </button>
                                                                    <strong className="ms-auto whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>
                                                                        {standing?.conceptName} · {enrollmentPriceLabel}
                                                                    </strong>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <p className="text-sm" style={{color: "var(--danger)"}}>
                                                                Configura el precio de {standing?.conceptName} en Conceptos de pago para poder inscribir.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <div className={`space-y-3 ${conceptsLocked ? "pointer-events-none opacity-50" : ""}`} aria-disabled={conceptsLocked}>
                                                    <h3 className="text-base font-bold" style={{color: "var(--text-primary)"}}>
                                                        Conceptos{conceptsLocked && <span className="ms-2 text-xs font-normal" style={{color: "var(--text-tertiary)"}}>disponibles después de elegir el curso de la inscripción</span>}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {products.filter((product) => Number(product.price) > 0).map((product) => (
                                                            <button key={product.id} type="button" onClick={() => void addToCart(product.id)} disabled={conceptsLocked}
                                                                    className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                                                                    style={{borderColor: "var(--border-soft)", color: "var(--text-secondary)", background: "var(--surface)"}}>
                                                                + {product.name} · {money.format(Number(product.price))}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                                        <select className="select select-bordered select-sm w-full" value={productId} aria-label="Concepto"
                                                                onChange={(event) => setProductId(event.target.value)}>
                                                            <option value="">Otro concepto…</option>
                                                            {products.map((product) => (
                                                                <option key={product.id} value={product.id}>
                                                                    {product.name}{Number(product.price) > 0 ? ` · ${money.format(Number(product.price))}` : " · sin precio"}
                                                                </option>
                                                            ))}
                                                        </select>
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
                                                                        <span className="block text-xs" style={{color: "var(--text-tertiary)"}}>
                                                                            {line.upcoming
                                                                                ? lineDescriptions(line).map((text) => text.replace(`${line.name} `, "")).join(", ")
                                                                                : `${line.quantity > 1 ? `${line.quantity} × ` : ""}${money.format(line.unitPrice)}`}
                                                                        </span>
                                                                    </span>
                                                                    {line.upcoming && (
                                                                        <span className="flex items-center gap-1" title="Periodos que se pagan por adelantado">
                                                                            <button type="button" className="row-action" aria-label={`Un periodo menos de ${line.name}`}
                                                                                    disabled={line.quantity <= 1} onClick={() => changePeriods(line, line.quantity - 1)}>
                                                                                <i className="fa fa-minus text-xs"/>
                                                                            </button>
                                                                            <span className="w-16 text-center text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                                                                {line.quantity} de {line.upcoming.length}
                                                                            </span>
                                                                            <button type="button" className="row-action" aria-label={`Un periodo más de ${line.name}`}
                                                                                    disabled={line.quantity >= line.upcoming.length} onClick={() => changePeriods(line, line.quantity + 1)}>
                                                                                <i className="fa fa-plus text-xs"/>
                                                                            </button>
                                                                        </span>
                                                                    )}
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
                                                                               disabled={invoice.id === pendingEnrollmentInvoice}
                                                                               title={invoice.id === pendingEnrollmentInvoice ? "La inscripción se cobra primero" : undefined}
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
                                                            <button key={value} type="button" onClick={() => {
                                                                setMethod(value);
                                                                if (!NEEDS_REFERENCE.includes(value)) setReference("");
                                                            }}
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
                                                        {NEEDS_REFERENCE.includes(method) ? (
                                                            <label className="block"><Label>Referencia*</Label>
                                                                <input className="input input-bordered input-sm w-full" maxLength={128} value={reference}
                                                                       placeholder={method === PaymentMethod.CHECK ? "N.º de cheque" : "N.º de transferencia"}
                                                                       onChange={(event) => setReference(event.target.value)}/>
                                                            </label>
                                                        ) : null}
                                                        <label className="block"><Label>Fecha</Label>
                                                            <input type="date" className="input input-bordered input-sm w-full" value={date} max={today()}
                                                                   onChange={(event) => setDate(event.target.value)}/>
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
                                                    {notEnrolled && enrollCourse && <li><i className="fa fa-user-check me-2"/>Se inscribe en {[enrollCourse.name, enrollCourse.division].filter(Boolean).join(" ")} con {standing?.conceptName} {enrollmentAmount > 0 ? `por ${money.format(enrollmentAmount)}` : "sin costo"}.</li>}
                                                    {cart.length > 0 && <li><i className="fa fa-file-invoice-dollar me-2"/>Se crea una factura por {money.format(subtotal - discountAmount)} con {cart.length} {cart.length === 1 ? "concepto" : "conceptos"}{discountAmount > 0 && ` (descuento ${money.format(discountAmount)})`}.</li>}
                                                    {pending.length > 0 && <li><i className="fa fa-clock-rotate-left me-2"/>Se pagan {pending.length} {pending.length === 1 ? "factura pendiente" : "facturas pendientes"} por {money.format(pendingTotal)}.</li>}
                                                    <li><i className={`fa ${PaymentMethodIcon[method]} me-2`}/>{receivedAmount > 0 ? `Se reciben ${money.format(receivedAmount)} en ${PaymentMethodLabel[method].toLowerCase()}.` : total === 0 ? "No hay nada que cobrar." : "No se recibe dinero: todo queda pendiente."}</li>
                                                    {balance > 0 && receivedAmount > 0 && <li style={{color: "var(--warning)"}}><i className="fa fa-hourglass-half me-2"/>Quedan {money.format(balance)} pendientes.</li>}
                                                    {balance < 0 && <li style={{color: "var(--success)"}}><i className="fa fa-coins me-2"/>Devuelta: {money.format(-balance)}.</li>}
                                                </ul>
                                                <div>
                                                    <Label>Nota del recibo</Label>
                                                    <div className="flex items-start gap-2">
                                                        <textarea className="input h-auto min-h-[5rem] min-w-0 flex-1 resize-none py-2.5 text-sm leading-relaxed" maxLength={500} rows={3}
                                                                  value={notes} placeholder={assistant?.enabled ? "La IA la escribe; puedes cambiarla" : "Opcional"}
                                                                  onChange={(event) => {
                                                                      setNotes(event.target.value);
                                                                      setNoteByHand(true);
                                                                  }}/>
                                                        {assistant?.enabled && (
                                                            <button type="button" className="btn btn-sm btn-square shrink-0" disabled={writingNote}
                                                                    title="Escribir otra nota con IA" aria-label="Escribir otra nota con IA" onClick={() => void writeNote()}>
                                                                <i className={`fa ${writingNote ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} style={{color: "var(--accent)"}}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {assistant?.enabled && (
                                                        <p className="mt-1 text-xs" style={{color: "var(--text-tertiary)"}}>
                                                            {writingNote ? "La IA está escribiendo la nota…" : noteByHand ? "Nota escrita a mano." : notes ? "Escrita por IA; puedes editarla o pedir otra." : ""}
                                                        </p>
                                                    )}
                                                </div>
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
                                    {receivedAmount > 0 ? `Cobrar ${money.format(Math.min(receivedAmount, total))}` : total === 0 && enrolling ? "Inscribir sin costo" : "Crear factura sin pago"}
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
