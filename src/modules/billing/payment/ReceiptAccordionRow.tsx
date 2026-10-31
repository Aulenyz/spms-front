import {useState} from "react";
import {Link} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ReceiptService} from "../../../services/billing/BillingService.ts";
import {formatDate, money, PaymentMethodIcon, PaymentMethodLabel, Receipt, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {PaymentMethodTag, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {VoidDialog} from "../components/VoidDialog.tsx";
import {printHtml, receiptHtml} from "../print/printDocuments.ts";

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
                <div role="button" tabIndex={0} onClick={onToggle} aria-expanded={open}
                     onKeyDown={(event) => {
                         if (event.key === "Enter" || event.key === " ") {
                             event.preventDefault();
                             onToggle();
                         }
                     }}
                     className="grid cursor-pointer min-w-0 flex-1 grid-cols-[1rem_7.5rem_minmax(0,1fr)_auto_auto] items-center gap-4 px-4 py-3 text-left transition hover:bg-[var(--surface-muted)] xl:grid-cols-[1rem_7.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto]">
                    <i className={`fa fa-chevron-right text-xs transition-transform ${open ? "rotate-90" : ""}`}
                       style={{color: "var(--text-tertiary)"}} aria-hidden="true"/>
                    <span className="min-w-0">
                        <strong className="block whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>{receipt.number}</strong>
                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>{formatDate(receipt.date)}</span>
                    </span>
                    <span className="min-w-0">
                        <Link to={`/accounts/${receipt.student.id}`} onClick={(event) => event.stopPropagation()}
                              title="Ver estado de cuenta del estudiante"
                              className="block truncate text-sm hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-primary)"}}>
                            {receipt.student.name}
                        </Link>
                        {receipt.guardian && <span className="block truncate text-xs" style={{color: "var(--text-tertiary)"}}>Pagó {receipt.guardian.name}</span>}
                    </span>
                    <span className="hidden min-w-0 xl:block"><PaymentMethodTag method={receipt.method}/></span>
                    <span className={`whitespace-nowrap text-right text-sm font-bold ${voided ? "line-through" : ""}`}
                          style={{color: voided ? "var(--text-tertiary)" : "var(--text-primary)"}}>{money.format(receipt.amount)}</span>
                    <ReceiptStatusPill status={receipt.status}/>
                </div>
                <button type="button" className="row-action" title="Imprimir recibo" aria-label={`Imprimir recibo ${receipt.number}`}
                        disabled={printing === "receipt"} onClick={() => void printReceipt()}>
                    <i className={`fa ${printing === "receipt" ? "fa-spinner fa-spin" : "fa-print"}`}/>
                </button>
            </div>

            {open && (
                <div className="border-t px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                    {detailsQuery.isPending ? (
                        <p className="text-xs" style={{color: "var(--text-secondary)"}}><i className="fa fa-spinner fa-spin me-2"/>Cargando…</p>
                    ) : details && (
                        <div className="flex items-start gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                                <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs" style={{color: "var(--text-secondary)"}}>
                                    <span><i className="fa fa-user me-1.5" style={{color: "var(--text-tertiary)"}}/>Pagó <strong style={{color: "var(--text-primary)"}}>{receipt.guardian?.name ?? "—"}</strong></span>
                                    <span><i className={`fa ${PaymentMethodIcon[receipt.method]} me-1.5`} style={{color: "var(--text-tertiary)"}}/>{PaymentMethodLabel[receipt.method]}{receipt.reference && ` · Ref. ${receipt.reference}`}</span>
                                    <span><i className="fa fa-user-check me-1.5" style={{color: "var(--text-tertiary)"}}/>Recibió {details.receivedBy ?? "—"} · {formatDate(receipt.createdAt)}</span>
                                    {details.notes && <span><i className="fa fa-note-sticky me-1.5" style={{color: "var(--text-tertiary)"}}/>{details.notes}</span>}
                                </p>
                                <ul className="divide-y rounded-xl border text-sm" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                    {details.payments.map((payment) => (
                                        <li key={payment.id} className="flex items-center gap-3 px-3 py-1.5" style={{borderColor: "var(--border-soft)"}}>
                                            <Link to={`/invoices/${payment.invoiceId}`} className="whitespace-nowrap font-semibold hover:text-[var(--accent)]">{payment.invoiceNumber}</Link>
                                            <span className="min-w-0 flex-1 truncate" style={{color: "var(--text-secondary)"}}>{payment.description ?? "—"}</span>
                                            <span className="whitespace-nowrap font-semibold" style={{color: "var(--text-primary)"}}>{money.format(payment.amount)}</span>
                                        </li>
                                    ))}
                                </ul>
                                {details.voidReason && (
                                    <p className="text-xs" style={{color: "var(--danger)"}}><i className="fa fa-ban me-1.5"/>Anulado el {formatDate(details.voidedAt)}: {details.voidReason}</p>
                                )}
                            </div>
                            {!voided && hasAuthority(AuthorityKey.PAYMENT_VOID) && (
                                <button type="button" className="btn btn-xs shrink-0" onClick={() => setVoiding(true)}><i className="fa fa-ban"/>Anular</button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <VoidDialog isOpen={voiding} title={`Anular ${receipt.number}`} loading={voidReceipt.isPending}
                        consequence="El monto vuelve a quedar pendiente en las facturas que pagó. Si pagaba una inscripción, la inscripción vuelve a pendiente."
                        onConfirm={(reason) => voidReceipt.mutate(reason)} onClose={() => setVoiding(false)}/>
        </li>
    );
};
