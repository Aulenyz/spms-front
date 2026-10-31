import {useEffect, useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService, ReceiptService} from "../../../services/billing/BillingService.ts";
import {
    formatDate,
    money,
    NEEDS_REFERENCE,
    PaymentMethod,
    PaymentMethodIcon,
    PaymentMethodLabel,
    PersonRef,
    ReceiptDetails,
} from "../../../domain/billing/Invoice.ts";
import {InvoiceStatusPill} from "../components/BillingPills.tsx";
import {StudentPicker} from "../components/StudentPicker.tsx";

const invoiceService = InvoiceService.instance;
const receiptService = ReceiptService.instance;
const today = () => new Date().toISOString().slice(0, 10);
const round = (value: number) => Math.round(value * 100) / 100;

type Props = {
    isOpen: boolean;
    onClose: () => void;
    /** Estudiante ya elegido (desde su estado de cuenta o una factura). */
    student?: PersonRef | null;
    /** Si viene de una factura, solo esa queda marcada al inicio. */
    invoiceId?: number;
};

/**
 * Registra un pago: el estudiante, cuánto se abona a cada factura pendiente y la forma de pago.
 * Al guardar genera un recibo que se puede imprimir.
 */
export const RegisterPaymentModal = ({isOpen, onClose, student: initialStudent, invoiceId}: Props) => {
    const queryClient = useQueryClient();
    const [student, setStudent] = useState<PersonRef | null>(initialStudent ?? null);
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [reference, setReference] = useState("");
    const [date, setDate] = useState(today());
    const [notes, setNotes] = useState("");
    const [result, setResult] = useState<ReceiptDetails | null>(null);

    useEffect(() => {
        if (isOpen) setStudent(initialStudent ?? null);
    }, [isOpen, initialStudent]);

    const invoicesQuery = useQuery({
        queryKey: queryKeys.invoices.open(student?.id),
        queryFn: ({signal}) => invoiceService.withSignal(signal).open(student!.id),
        enabled: isOpen && Boolean(student),
        meta: {errorMessage: "No se pudieron cargar las facturas pendientes."},
    });
    const invoices = useMemo(() => [...(invoicesQuery.data?.content ?? [])]
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")), [invoicesQuery.data]);

    // Al cargar las facturas se propone pagar todo (o solo la factura de origen).
    useEffect(() => {
        if (!invoicesQuery.data) return;
        setAmounts(Object.fromEntries(invoicesQuery.data.content
            .filter((invoice) => invoiceId === undefined || invoice.id === invoiceId)
            .map((invoice) => [invoice.id, String(invoice.due)])));
    }, [invoicesQuery.data, invoiceId]);

    const allocations = invoices
        .filter((invoice) => amounts[invoice.id] !== undefined && Number(amounts[invoice.id]) > 0)
        .map((invoice) => ({invoiceId: invoice.id, amount: round(Number(amounts[invoice.id]))}));
    const total = round(allocations.reduce((sum, item) => sum + item.amount, 0));
    const owed = round(invoices.reduce((sum, invoice) => sum + invoice.due, 0));
    const tooMuch = invoices.some((invoice) => Number(amounts[invoice.id] ?? 0) > invoice.due);
    const needsReference = NEEDS_REFERENCE.includes(method) && !reference.trim();

    const register = useMutation({
        mutationFn: () => receiptService.register({
            studentId: student!.id, method, date, allocations, amount: total,
            reference: reference.trim() || undefined, notes: notes.trim() || undefined,
        }),
        onSuccess: (saved) => {
            setResult(saved);
            toast.success(`Pago registrado. Recibo ${saved.receipt.number}.`);
            [queryKeys.invoices.all, queryKeys.payments.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo registrar el pago."),
    });

    const reset = () => {
        setAmounts({});
        setMethod(PaymentMethod.CASH);
        setReference("");
        setDate(today());
        setNotes("");
        setResult(null);
    };

    const close = () => {
        reset();
        setStudent(initialStudent ?? null);
        onClose();
    };

    const toggle = (id: number, due: number) => setAmounts((current) => {
        const next = {...current};
        if (next[id] !== undefined) delete next[id];
        else next[id] = String(due);
        return next;
    });

    const canSave = Boolean(student) && total > 0 && !tooMuch && !needsReference && !register.isPending;

    return (
        <CenterModal title="Registrar pago" description="Elige qué facturas se pagan y cómo pagó la familia."
                     isOpen={isOpen} onClose={close} className="max-w-3xl">
            {result ? (
                <div className="space-y-5 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl"
                          style={{background: "var(--success-soft)", color: "var(--success)"}}>
                        <i className="fa fa-check"/>
                    </span>
                    <div>
                        <h3 className="text-lg font-bold" style={{color: "var(--text-primary)"}}>
                            Recibo {result.receipt.number} por {money.format(result.receipt.amount)}
                        </h3>
                        <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>
                            {result.receipt.student.name} · {PaymentMethodLabel[result.receipt.method]} · {result.payments.length} {result.payments.length === 1 ? "factura" : "facturas"}
                        </p>
                    </div>
                    <div className="flex justify-center gap-2">
                        <button type="button" className="btn btn-sm" onClick={() => {
                            reset();
                            setStudent(initialStudent ?? null);
                        }}>Registrar otro</button>
                        <Link to={`/payments/${result.receipt.id}`} className="btn btn-sm btn-primary" onClick={close}>
                            <i className="fa fa-print"/>Ver e imprimir recibo
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    {initialStudent ? (
                        <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                            Estudiante: <strong style={{color: "var(--text-primary)"}}>{initialStudent.name}</strong>
                        </p>
                    ) : (
                        <StudentPicker value={student} onChange={(value) => {
                            setStudent(value);
                            setAmounts({});
                        }}/>
                    )}

                    {student && (
                        <section className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                            <header className="flex items-center justify-between px-4 py-3 text-sm"
                                    style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                <strong style={{color: "var(--text-primary)"}}>Facturas pendientes</strong>
                                <span>Debe {money.format(owed)}</span>
                            </header>
                            {invoicesQuery.isPending ? (
                                <p className="p-5 text-center text-sm"><i className="fa fa-spinner fa-spin me-2"/>Cargando…</p>
                            ) : invoices.length === 0 ? (
                                <p className="p-5 text-center text-sm" style={{color: "var(--text-tertiary)"}}>
                                    Este estudiante no tiene facturas pendientes.
                                </p>
                            ) : (
                                <ul>
                                    {invoices.map((invoice) => {
                                        const selected = amounts[invoice.id] !== undefined;
                                        const over = Number(amounts[invoice.id] ?? 0) > invoice.due;
                                        return (
                                            <li key={invoice.id} className="flex items-center gap-3 border-t px-4 py-3"
                                                style={{borderColor: "var(--border-soft)"}}>
                                                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                                                       checked={selected} onChange={() => toggle(invoice.id, invoice.due)}
                                                       aria-label={`Pagar ${invoice.number}`}/>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <strong className="text-sm" style={{color: "var(--text-primary)"}}>{invoice.description ?? invoice.number}</strong>
                                                        <InvoiceStatusPill status={invoice.status}/>
                                                    </div>
                                                    <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                                        {invoice.number} · vence {formatDate(invoice.dueDate)} · saldo {money.format(invoice.due)}
                                                    </span>
                                                </div>
                                                <input type="number" min={0} step="0.01" inputMode="decimal"
                                                       className={`input input-bordered input-sm w-32 text-right ${over ? "input-error" : ""}`}
                                                       disabled={!selected} value={amounts[invoice.id] ?? ""}
                                                       onChange={(event) => setAmounts((current) => ({...current, [invoice.id]: event.target.value}))}
                                                       aria-label={`Monto para ${invoice.number}`}/>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </section>
                    )}

                    {student && invoices.length > 0 && (
                        <>
                            <div>
                                <span className="form-label mb-2 block text-sm font-semibold">Forma de pago</span>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(PaymentMethod).map((value) => (
                                        <button key={value} type="button" onClick={() => setMethod(value)}
                                                className={`btn btn-sm ${method === value ? "btn-primary" : ""}`}>
                                            <i className={`fa ${PaymentMethodIcon[value]}`}/>{PaymentMethodLabel[value]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="form-label mb-1 block text-sm font-semibold">
                                        Referencia{NEEDS_REFERENCE.includes(method) ? "*" : ""}
                                    </span>
                                    <input className="input input-bordered input-sm w-full" value={reference} maxLength={128}
                                           placeholder={NEEDS_REFERENCE.includes(method) ? "Número de transferencia o cheque" : "Opcional"}
                                           onChange={(event) => setReference(event.target.value)}/>
                                </label>
                                <label className="block">
                                    <span className="form-label mb-1 block text-sm font-semibold">Fecha del pago</span>
                                    <input type="date" className="input input-bordered input-sm w-full" value={date} max={today()}
                                           onChange={(event) => setDate(event.target.value)}/>
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="form-label mb-1 block text-sm font-semibold">Nota</span>
                                    <input className="input input-bordered input-sm w-full" value={notes} maxLength={500}
                                           placeholder="Opcional" onChange={(event) => setNotes(event.target.value)}/>
                                </label>
                            </div>
                        </>
                    )}

                    {tooMuch && (
                        <p className="text-sm" style={{color: "var(--danger)"}}>
                            <i className="fa fa-triangle-exclamation me-2"/>Un monto supera el saldo de su factura.
                        </p>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                        <div>
                            <span className="block text-xs uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>Total a cobrar</span>
                            <strong className="text-xl" style={{color: "var(--text-primary)"}}>{money.format(total)}</strong>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" className="btn btn-sm" onClick={close}>Cancelar</button>
                            <button type="button" className="btn btn-sm btn-primary" disabled={!canSave} onClick={() => register.mutate()}>
                                {register.isPending ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-check"/>}
                                Registrar pago
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CenterModal>
    );
};
