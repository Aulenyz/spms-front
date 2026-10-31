import {ReactNode, useState} from "react";
import {Link} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ReceiptService} from "../../../services/billing/BillingService.ts";
import {formatDate, money, PaymentMethodLabel, Receipt, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {ReceiptStatusPill} from "../components/BillingPills.tsx";
import {VoidDialog} from "../components/VoidDialog.tsx";
import {printHtml, receiptHtml} from "../print/printDocuments.ts";

/** Columnas compartidas por el encabezado y las filas: flecha, recibo, fecha, total, estado, acción. */
export const RECEIPT_COLUMNS = "grid grid-cols-[1.5rem_minmax(7rem,1.3fr)_minmax(6rem,1fr)_7rem_5.5rem_6rem] items-center gap-3";

export const ReceiptListHeader = () => (
    <div className={`${RECEIPT_COLUMNS} border-b px-3 py-3 text-xs font-semibold uppercase tracking-[0.06em]`}
         style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-tertiary)"}}>
        <span/>
        <span>Recibo</span>
        <span>Fecha</span>
        <span className="text-right">Total</span>
        <span>Estado</span>
        <span className="text-right">Acción</span>
    </div>
);

const Field = ({label, children, wide}: {label: string; children: ReactNode; wide?: boolean}) => (
    <div className={wide ? "sm:col-span-2" : undefined}>
        <dt className="text-xs" style={{color: "var(--text-tertiary)"}}>{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold" style={{color: "var(--text-primary)"}}>{children || "—"}</dd>
    </div>
);

/** Un pago de la lista: la flecha lo abre en el lugar con su detalle; el botón imprime el recibo. */
export const ReceiptAccordionRow = ({receipt, open, onToggle}: {receipt: Receipt; open: boolean; onToggle: () => void}) => {
    const queryClient = useQueryClient();
    const {hasAuthority} = useAuthContext();
    const [voiding, setVoiding] = useState(false);
    const [printing, setPrinting] = useState(false);

    const detailsQuery = useQuery({
        queryKey: queryKeys.payments.details(receipt.id),
        queryFn: ({signal}) => ReceiptService.instance.withSignal(signal).details(receipt.id),
        enabled: open,
        meta: {errorMessage: "No se pudo cargar el pago."},
    });
    const details = detailsQuery.data;

    const printReceipt = async () => {
        setPrinting(true);
        try {
            const loaded = await queryClient.fetchQuery({
                queryKey: queryKeys.payments.details(receipt.id),
                queryFn: () => ReceiptService.instance.details(receipt.id),
            });
            printHtml(receiptHtml(loaded));
        } catch {
            toast.error("No se pudo preparar el recibo para imprimir.");
        } finally {
            setPrinting(false);
        }
    };

    const voidReceipt = useMutation({
        mutationFn: (reason: string) => ReceiptService.instance.voidReceipt(receipt.id, reason),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.payments.details(receipt.id), saved);
            [queryKeys.payments.all, queryKeys.invoices.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
            setVoiding(false);
            toast.success("Pago anulado. El saldo volvió a las facturas.");
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo anular el pago."),
    });

    const voided = receipt.status !== ReceiptStatus.PAID;

    return (
        <li className="border-b last:border-b-0" style={{borderColor: "var(--border-soft)"}}>
            <div className={`${RECEIPT_COLUMNS} px-3 py-3`}>
                <button type="button" onClick={onToggle} aria-expanded={open} className="row-action"
                        aria-label={open ? `Cerrar ${receipt.number}` : `Ver detalle de ${receipt.number}`}>
                    <i className={`fa fa-chevron-down text-xs transition-transform ${open ? "rotate-180" : ""}`}/>
                </button>
                <span className="min-w-0">
                    <button type="button" onClick={onToggle} className="block whitespace-nowrap text-left font-semibold hover:underline" style={{color: "var(--success)"}}>
                        {receipt.number}
                    </button>
                    <Link to={`/accounts/${receipt.student.id}`} title="Ver estado de cuenta del estudiante"
                          className="block truncate text-sm hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-secondary)"}}>
                        {receipt.student.name}
                    </Link>
                </span>
                <span className="min-w-0">
                    <span className="block whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>{formatDate(receipt.date)}</span>
                    <span className="block truncate text-xs" style={{color: "var(--text-tertiary)"}}>{PaymentMethodLabel[receipt.method]}</span>
                </span>
                <span className={`whitespace-nowrap text-right font-bold ${voided ? "line-through" : ""}`}
                      style={{color: voided ? "var(--text-tertiary)" : "var(--text-primary)"}}>{money.format(receipt.amount)}</span>
                <span><ReceiptStatusPill status={receipt.status}/></span>
                <span className="text-right">
                    <button type="button" className="btn btn-sm px-3" disabled={printing} onClick={() => void printReceipt()}
                            aria-label={`Imprimir recibo ${receipt.number}`}>
                        <i className={`fa ${printing ? "fa-spinner fa-spin" : "fa-print"}`}/>Imprimir
                    </button>
                </span>
            </div>

            {open && (
                <div className="px-3 pb-4">
                    <div className="rounded-2xl p-4" style={{background: "var(--surface-muted)"}}>
                        {detailsQuery.isPending ? (
                            <p className="text-sm" style={{color: "var(--text-secondary)"}}><i className="fa fa-spinner fa-spin me-2"/>Cargando…</p>
                        ) : details && (
                            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3 xl:grid-cols-4">
                                <Field label="Estudiante">{receipt.student.name}</Field>
                                <Field label="Documento">{receipt.student.document}</Field>
                                <Field label="Pagado por">{receipt.guardian?.name}</Field>
                                <Field label="Forma de pago">{PaymentMethodLabel[receipt.method]}</Field>
                                <Field label="Referencia">{receipt.reference}</Field>
                                <Field label="Total recibido">{money.format(receipt.amount)}</Field>
                                <Field label="Recibido por">{details.receivedBy}</Field>
                                <Field label="Fecha de registro">{formatDate(receipt.createdAt)}</Field>
                                <Field label={details.payments.length === 1 ? "Factura pagada" : "Facturas pagadas"} wide>
                                    <span className="flex flex-col gap-0.5">
                                        {details.payments.map((payment) => (
                                            <span key={payment.id}>
                                                <Link to={`/invoices/${payment.invoiceId}`} className="hover:text-[var(--accent)] hover:underline">{payment.invoiceNumber}</Link>
                                                <span className="font-normal" style={{color: "var(--text-secondary)"}}> · {payment.description ?? "—"} · {money.format(payment.amount)}</span>
                                            </span>
                                        ))}
                                    </span>
                                </Field>
                                {details.voidReason ? (
                                    <Field label="Anulado">
                                        <span style={{color: "var(--danger)"}}>{formatDate(details.voidedAt)} · {details.voidReason}</span>
                                    </Field>
                                ) : (
                                    <Field label="Nota">{details.notes}</Field>
                                )}
                                {!voided && hasAuthority(AuthorityKey.PAYMENT_VOID) && (
                                    <div className="flex items-end justify-end sm:col-span-3 xl:col-span-4">
                                        <button type="button" className="btn btn-sm" onClick={() => setVoiding(true)}>
                                            <i className="fa fa-ban"/>Anular pago
                                        </button>
                                    </div>
                                )}
                            </dl>
                        )}
                    </div>
                </div>
            )}

            <VoidDialog isOpen={voiding} title={`Anular ${receipt.number}`} loading={voidReceipt.isPending}
                        consequence="El monto vuelve a quedar pendiente en las facturas que pagó. Si pagaba una inscripción, la inscripción vuelve a pendiente."
                        onConfirm={(reason) => voidReceipt.mutate(reason)} onClose={() => setVoiding(false)}/>
        </li>
    );
};
