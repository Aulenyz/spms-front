import {useState} from "react";
import {Link} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService, ReceiptService} from "../../../services/billing/BillingService.ts";
import {formatDate, money, PaymentMethodLabel, Receipt, ReceiptDetails, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {PaymentMethodTag, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {VoidDialog} from "../components/VoidDialog.tsx";
import {invoiceHtml, printHtml, receiptHtml} from "../print/printDocuments.ts";

const Item = ({label, children}: {label: string; children: React.ReactNode}) => (
    <div>
        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold" style={{color: "var(--text-primary)"}}>{children}</dd>
    </div>
);

/** Un pago de la lista: se abre en el lugar con todo su detalle, y se imprime el recibo o sus facturas. */
export const ReceiptAccordionRow = ({receipt, open, onToggle}: {receipt: Receipt; open: boolean; onToggle: () => void}) => {
    const queryClient = useQueryClient();
    const {hasAuthority} = useAuthContext();
    const [voiding, setVoiding] = useState(false);
    const [printing, setPrinting] = useState<string | null>(null);

    const detailsQuery = useQuery({
        queryKey: queryKeys.payments.details(receipt.id),
        queryFn: ({signal}) => ReceiptService.instance.withSignal(signal).details(receipt.id),
        enabled: open,
        meta: {errorMessage: "No se pudo cargar el pago."},
    });
    const details = detailsQuery.data;

    const loadDetails = () => queryClient.fetchQuery({
        queryKey: queryKeys.payments.details(receipt.id),
        queryFn: () => ReceiptService.instance.details(receipt.id),
    });

    const printReceipt = async () => {
        setPrinting("receipt");
        try {
            printHtml(receiptHtml(await loadDetails()));
        } catch {
            toast.error("No se pudo preparar el recibo para imprimir.");
        } finally {
            setPrinting(null);
        }
    };

    const printInvoice = async (invoiceId: number, source: ReceiptDetails) => {
        setPrinting(`invoice-${invoiceId}`);
        try {
            const invoice = await queryClient.fetchQuery({
                queryKey: queryKeys.invoices.details(invoiceId),
                queryFn: () => InvoiceService.instance.details(invoiceId),
            });
            printHtml(invoiceHtml(invoice, source.organization));
        } catch {
            toast.error("No se pudo preparar la factura para imprimir.");
        } finally {
            setPrinting(null);
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
            <div className="flex items-center gap-2 pe-3">
                <button type="button" onClick={onToggle} aria-expanded={open}
                        className="grid min-w-0 flex-1 grid-cols-[7.5rem_minmax(0,1fr)_auto_auto] items-center gap-4 px-4 py-3 text-left transition hover:bg-[var(--surface-muted)] xl:grid-cols-[7.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]">
                    <span className="min-w-0">
                        <strong className="block whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>{receipt.number}</strong>
                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>{formatDate(receipt.date)}</span>
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{receipt.student.name}</span>
                        {receipt.guardian && <span className="block truncate text-xs" style={{color: "var(--text-tertiary)"}}>Pagó {receipt.guardian.name}</span>}
                    </span>
                    <span className="hidden min-w-0 xl:block"><PaymentMethodTag method={receipt.method}/></span>
                    <span className={`whitespace-nowrap text-right text-sm font-bold ${voided ? "line-through" : ""}`}
                          style={{color: voided ? "var(--text-tertiary)" : "var(--text-primary)"}}>{money.format(receipt.amount)}</span>
                    <span className="flex items-center gap-3">
                        <ReceiptStatusPill status={receipt.status}/>
                        <i className={`fa fa-chevron-down text-xs transition-transform ${open ? "rotate-180" : ""}`} style={{color: "var(--text-tertiary)"}}/>
                    </span>
                </button>
                <button type="button" className="row-action" title="Imprimir recibo" aria-label={`Imprimir recibo ${receipt.number}`}
                        disabled={printing === "receipt"} onClick={() => void printReceipt()}>
                    <i className={`fa ${printing === "receipt" ? "fa-spinner fa-spin" : "fa-print"}`}/>
                </button>
            </div>

            {open && (
                <div className="space-y-4 px-4 pb-5 pt-1" style={{background: "var(--surface-muted)"}}>
                    {detailsQuery.isPending ? (
                        <p className="py-4 text-sm" style={{color: "var(--text-secondary)"}}><i className="fa fa-spinner fa-spin me-2"/>Cargando…</p>
                    ) : details && (
                        <>
                            <dl className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-4"
                                style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <Item label="Estudiante">
                                    <Link to={`/accounts/${receipt.student.id}`} className="hover:text-[var(--accent)]">{receipt.student.name}</Link>
                                    {receipt.student.document && <span className="block text-xs font-normal" style={{color: "var(--text-tertiary)"}}>{receipt.student.document}</span>}
                                </Item>
                                <Item label="Pagado por">{receipt.guardian?.name ?? "—"}</Item>
                                <Item label="Forma de pago">
                                    {PaymentMethodLabel[receipt.method]}
                                    {receipt.reference && <span className="block text-xs font-normal" style={{color: "var(--text-tertiary)"}}>Ref. {receipt.reference}</span>}
                                </Item>
                                <Item label="Recibido por">
                                    {details.receivedBy ?? "—"}
                                    <span className="block text-xs font-normal" style={{color: "var(--text-tertiary)"}}>{formatDate(receipt.createdAt)}</span>
                                </Item>
                            </dl>

                            <div className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <table className="table-shell">
                                    <thead>
                                    <tr><th>Factura</th><th>Concepto</th><th className="text-right">Abonado</th><th className="w-12"/></tr>
                                    </thead>
                                    <tbody>
                                    {details.payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td><Link to={`/invoices/${payment.invoiceId}`} className="font-semibold hover:text-[var(--accent)]">{payment.invoiceNumber}</Link></td>
                                            <td>{payment.description ?? "—"}</td>
                                            <td className="text-right">{money.format(payment.amount)}</td>
                                            <td className="text-right">
                                                <button type="button" className="row-action" title="Imprimir factura" aria-label={`Imprimir factura ${payment.invoiceNumber}`}
                                                        disabled={printing === `invoice-${payment.invoiceId}`}
                                                        onClick={() => void printInvoice(payment.invoiceId, details)}>
                                                    <i className={`fa ${printing === `invoice-${payment.invoiceId}` ? "fa-spinner fa-spin" : "fa-file-invoice"}`}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                    <tfoot>
                                    <tr><td colSpan={2} className="text-right font-semibold">Total recibido</td><td className="text-right font-bold">{money.format(receipt.amount)}</td><td/></tr>
                                    </tfoot>
                                </table>
                            </div>

                            {(details.notes || details.voidReason) && (
                                <div className="space-y-1 text-sm" style={{color: "var(--text-secondary)"}}>
                                    {details.notes && <p><i className="fa fa-note-sticky me-2"/>{details.notes}</p>}
                                    {details.voidReason && (
                                        <p style={{color: "var(--danger)"}}><i className="fa fa-ban me-2"/>Anulado el {formatDate(details.voidedAt)}: {details.voidReason}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-2">
                                {!voided && hasAuthority(AuthorityKey.PAYMENT_VOID) && (
                                    <button type="button" className="btn btn-sm" onClick={() => setVoiding(true)}><i className="fa fa-ban"/>Anular</button>
                                )}
                                <button type="button" className="btn btn-sm btn-primary" disabled={printing === "receipt"} onClick={() => void printReceipt()}>
                                    <i className="fa fa-print"/>Imprimir recibo
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <VoidDialog isOpen={voiding} title={`Anular ${receipt.number}`} loading={voidReceipt.isPending}
                        consequence="El monto vuelve a quedar pendiente en las facturas que pagó. Si pagaba una inscripción, la inscripción vuelve a pendiente."
                        onConfirm={(reason) => voidReceipt.mutate(reason)} onClose={() => setVoiding(false)}/>
        </li>
    );
};
