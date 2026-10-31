import {useState} from "react";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import {useParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ReceiptService} from "../../../services/billing/BillingService.ts";
import {formatDate, money, PaymentMethodLabel, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {ReceiptStatusPill} from "../components/BillingPills.tsx";
import {VoidDialog} from "../components/VoidDialog.tsx";

/** Recibo de pago listo para imprimir, con las facturas que pagó. */
export const ReceiptDetailsPage = () => {
    const {id = ""} = useParams();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [voiding, setVoiding] = useState(false);

    const detailsQuery = useQuery({
        queryKey: queryKeys.payments.details(id),
        queryFn: ({signal}) => ReceiptService.instance.withSignal(signal).details(id),
        meta: {errorMessage: "No se pudo cargar el recibo."},
    });
    const details = detailsQuery.data;

    const voidReceipt = useMutation({
        mutationFn: (reason: string) => ReceiptService.instance.voidReceipt(Number(id), reason),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.payments.details(id), saved);
            [queryKeys.payments.all, queryKeys.invoices.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
            setVoiding(false);
            toast.success("Recibo anulado. El saldo volvió a las facturas.");
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo anular el recibo."),
    });

    if (detailsQuery.isPending) return <LoadingContent loading className="min-h-[320px]"><span/></LoadingContent>;
    if (!details) return <EmptyState title="Recibo no encontrado" icon="fa-receipt" description="Puede que haya sido eliminado."/>;

    const {receipt, organization, payments} = details;
    const voided = receipt.status !== ReceiptStatus.PAID;

    return (
        <div className="space-y-6">
            <div className="no-print">
                <DetailHeader
                    avatar="fa-receipt"
                    title={`Recibo ${receipt.number}`}
                    subtitle={<><PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/accounts/${receipt.student.id}`} className="hover:text-[var(--accent)]">{receipt.student.name}</PermittedLink> · {formatDate(receipt.date)}</>}
                    badges={<ReceiptStatusPill status={receipt.status}/>}
                    backTo="/payments/list"
                    backLabel="Pagos recibidos"
                    actions={<>
                        {!voided && hasAuthority(AuthorityKey.PAYMENT_VOID) && (
                            <button type="button" className="btn btn-sm" onClick={() => setVoiding(true)}><i className="fa fa-ban"/>Anular</button>
                        )}
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => window.print()}>
                            <i className="fa fa-print"/>Imprimir
                        </button>
                    </>}
                />
            </div>

            <article className="printable relative mx-auto max-w-3xl overflow-hidden rounded-[20px] border p-8"
                     style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
                {voided && (
                    <span className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rotate-[-12deg] rounded-lg border-4 px-4 py-1 text-3xl font-black uppercase tracking-widest opacity-60"
                          style={{borderColor: "var(--danger)", color: "var(--danger)"}}>Anulado</span>
                )}
                <header className="flex items-start justify-between gap-6 border-b pb-6" style={{borderColor: "var(--border-soft)"}}>
                    <div className="flex items-center gap-4">
                        {organization.logo && <img src={organization.logo} alt="" className="h-14 w-14 rounded-xl object-contain"/>}
                        <div>
                            <h2 className="text-lg font-extrabold" style={{color: "var(--text-primary)"}}>{organization.name}</h2>
                            {organization.document && <p className="text-sm" style={{color: "var(--text-secondary)"}}>RNC {organization.document}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{color: "var(--text-tertiary)"}}>Recibo de pago</p>
                        <p className="text-xl font-extrabold" style={{color: "var(--text-primary)"}}>{receipt.number}</p>
                        <p className="text-sm" style={{color: "var(--text-secondary)"}}>{formatDate(receipt.date)}</p>
                    </div>
                </header>

                <dl className="grid gap-4 py-6 text-sm sm:grid-cols-2">
                    <div><dt style={{color: "var(--text-tertiary)"}}>Estudiante</dt><dd className="font-semibold" style={{color: "var(--text-primary)"}}>{receipt.student.name}{receipt.student.document && ` · ${receipt.student.document}`}</dd></div>
                    <div><dt style={{color: "var(--text-tertiary)"}}>Pagado por</dt><dd className="font-semibold" style={{color: "var(--text-primary)"}}>{receipt.guardian?.name ?? "—"}</dd></div>
                    <div><dt style={{color: "var(--text-tertiary)"}}>Forma de pago</dt><dd className="font-semibold" style={{color: "var(--text-primary)"}}>{PaymentMethodLabel[receipt.method]}{receipt.reference && ` · Ref. ${receipt.reference}`}</dd></div>
                    <div><dt style={{color: "var(--text-tertiary)"}}>Recibido por</dt><dd className="font-semibold" style={{color: "var(--text-primary)"}}>{details.receivedBy ?? "—"}</dd></div>
                </dl>

                <table className="table-shell">
                    <thead><tr><th>Factura</th><th>Concepto</th><th className="text-right">Abonado</th></tr></thead>
                    <tbody>
                    {payments.map((payment) => (
                        <tr key={payment.id}>
                            <td><PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/invoices/${payment.invoiceId}`} className="hover:text-[var(--accent)]">{payment.invoiceNumber}</PermittedLink></td>
                            <td>{payment.description ?? "—"}</td>
                            <td className="text-right">{money.format(payment.amount)}</td>
                        </tr>
                    ))}
                    </tbody>
                    <tfoot>
                    <tr><td colSpan={2} className="text-right font-semibold">Total recibido</td><td className="text-right text-lg font-extrabold">{money.format(receipt.amount)}</td></tr>
                    </tfoot>
                </table>

                {(details.notes || details.voidReason) && (
                    <footer className="mt-6 space-y-1 text-sm" style={{color: "var(--text-secondary)"}}>
                        {details.notes && <p>Nota: {details.notes}</p>}
                        {details.voidReason && <p style={{color: "var(--danger)"}}>Anulado el {formatDate(details.voidedAt)}: {details.voidReason}</p>}
                    </footer>
                )}
            </article>

            <VoidDialog isOpen={voiding} title={`Anular ${receipt.number}`} loading={voidReceipt.isPending}
                        consequence="El monto vuelve a quedar pendiente en las facturas que pagó. Si pagaba una inscripción, la inscripción vuelve a pendiente."
                        onConfirm={(reason) => voidReceipt.mutate(reason)} onClose={() => setVoiding(false)}/>
        </div>
    );
};
