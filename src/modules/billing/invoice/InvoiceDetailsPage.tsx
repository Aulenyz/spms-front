import {useState} from "react";
import {Link, useParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService} from "../../../services/billing/BillingService.ts";
import {formatDate, InvoiceStatus, money, PaymentMethodLabel, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {InfoList} from "../../../components/ui/detail/InfoList.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {InvoiceStatusPill, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {VoidDialog} from "../components/VoidDialog.tsx";
import {RegisterPaymentModal} from "../payment/RegisterPaymentModal.tsx";
import {invoiceHtml, printHtml} from "../print/printDocuments.ts";
import {useCurrentOrganization} from "../../shared/main/navbarQueries.ts";

const OPEN = [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE];

export const InvoiceDetailsPage = () => {
    const {id = ""} = useParams();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const {data: organization} = useCurrentOrganization();
    const [paying, setPaying] = useState(false);
    const [voiding, setVoiding] = useState(false);

    const detailsQuery = useQuery({
        queryKey: queryKeys.invoices.details(id),
        queryFn: ({signal}) => InvoiceService.instance.withSignal(signal).details(id),
        meta: {errorMessage: "No se pudo cargar la factura."},
    });
    const details = detailsQuery.data;

    const voidInvoice = useMutation({
        mutationFn: (reason: string) => InvoiceService.instance.voidInvoice(Number(id), reason),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.invoices.details(id), saved);
            [queryKeys.invoices.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
            setVoiding(false);
            toast.success("Factura anulada.");
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo anular la factura."),
    });

    if (detailsQuery.isPending) return <LoadingContent loading className="min-h-[320px]"><span/></LoadingContent>;
    if (!details) return <EmptyState title="Factura no encontrada" icon="fa-file-invoice-dollar" description="Puede que haya sido eliminada."/>;

    const {invoice, items, payments} = details;
    const isOpen = OPEN.includes(invoice.status);
    const hasPayments = payments.some((payment) => payment.status === ReceiptStatus.PAID);

    return (
        <div className="space-y-6">
            <DetailHeader
                avatar="fa-file-invoice-dollar"
                title={invoice.description || `Factura ${invoice.number}`}
                subtitle={<>{invoice.number}{invoice.student && <> · <Link to={`/accounts/${invoice.student.id}`} className="hover:text-[var(--accent)]">{invoice.student.name}</Link></>}</>}
                badges={<InvoiceStatusPill status={invoice.status}/>}
                backTo="/invoices/list"
                backLabel="Facturas"
                actions={<>
                    <button type="button" className="btn btn-sm" onClick={() => printHtml(invoiceHtml(details, {
                        name: organization?.name ?? "", document: organization?.document, logo: organization?.logo,
                    }))}><i className="fa fa-print"/>Imprimir</button>
                    {isOpen && hasAuthority(AuthorityKey.INVOICE_VOID) && !hasPayments && (
                        <button type="button" className="btn btn-sm" onClick={() => setVoiding(true)}><i className="fa fa-ban"/>Anular</button>
                    )}
                    {isOpen && invoice.student && hasAuthority(AuthorityKey.COLLECTION_CREATE) && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying(true)}>
                            <i className="fa fa-receipt"/>Registrar pago
                        </button>
                    )}
                </>}
            />

            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    {label: "Total", value: invoice.total},
                    {label: "Pagado", value: invoice.paid},
                    {label: "Saldo", value: invoice.due},
                ].map((item) => (
                    <div key={item.label} className="rounded-[20px] border px-5 py-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                        <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>{item.label}</span>
                        <strong className="mt-1 block text-2xl" style={{color: "var(--text-primary)"}}>{money.format(item.value)}</strong>
                    </div>
                ))}
            </div>

            {details.voidReason && (
                <p className="rounded-xl px-4 py-3 text-sm" style={{background: "var(--surface-soft)", color: "var(--text-secondary)"}}>
                    <i className="fa fa-ban me-2"/>Anulada: {details.voidReason}
                </p>
            )}

            <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
                <DetailSection title="Datos de la factura">
                    <InfoList columns={1} items={[
                        {label: "Facturada a", value: invoice.guardian?.name},
                        {label: "Emitida", value: formatDate(invoice.emittedAt)},
                        {label: "Vence", value: formatDate(invoice.dueDate)},
                        {label: "Comprobante fiscal", value: invoice.ncf ?? "Sin NCF"},
                        {label: "Origen", value: invoice.manual ? "Factura manual" : "Inscripción o cobro automático"},
                    ]}/>
                </DetailSection>

                <DetailSection title="Conceptos" flush>
                    <div className="overflow-x-auto"><table className="table-shell min-w-[640px]">
                        <thead>
                        <tr>
                            <th>Concepto</th>
                            <th className="text-right">Cant.</th>
                            <th className="text-right">Precio</th>
                            <th className="text-right">Impuesto</th>
                            <th className="text-right">Importe</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.description}</td>
                                <td className="text-right">{Number(item.quantity)}</td>
                                <td className="text-right">{money.format(item.unitPrice)}</td>
                                <td className="text-right">{money.format(item.taxAmount)}</td>
                                <td className="text-right font-semibold">{money.format(item.amount)}</td>
                            </tr>
                        ))}
                        </tbody>
                        <tfoot>
                        <tr>
                            <td colSpan={4} className="text-right text-sm">Subtotal {money.format(invoice.subtotal)} · Impuestos {money.format(invoice.taxAmount)}</td>
                            <td className="text-right font-bold">{money.format(invoice.total)}</td>
                        </tr>
                        </tfoot>
                    </table></div>
                </DetailSection>
            </div>

            <DetailSection title="Pagos" description="Recibos que abonaron a esta factura." flush>
                {payments.length === 0 ? (
                    <p className="p-5 text-sm" style={{color: "var(--text-tertiary)"}}>Todavía no tiene pagos.</p>
                ) : (
                    <div className="overflow-x-auto"><table className="table-shell min-w-[640px]">
                        <thead>
                        <tr><th>Recibo</th><th>Fecha</th><th>Forma de pago</th><th className="text-right">Monto</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>{payment.receiptId
                                    ? <Link to={`/payments/${payment.receiptId}`} className="font-semibold hover:text-[var(--accent)]">{payment.receiptNumber}</Link>
                                    : "—"}</td>
                                <td className="whitespace-nowrap">{formatDate(payment.date)}</td>
                                <td>{PaymentMethodLabel[payment.method]}</td>
                                <td className="text-right">{money.format(payment.amount)}</td>
                                <td><ReceiptStatusPill status={payment.status}/></td>
                            </tr>
                        ))}
                        </tbody>
                    </table></div>
                )}
            </DetailSection>

            <RegisterPaymentModal isOpen={paying} onClose={() => {
                setPaying(false);
                void queryClient.invalidateQueries({queryKey: queryKeys.invoices.details(id)});
            }} student={invoice.student} invoiceId={invoice.id}/>
            <VoidDialog isOpen={voiding} title={`Anular ${invoice.number}`} loading={voidInvoice.isPending}
                        consequence="La factura deja de cobrarse. Si es la inscripción de un estudiante pendiente, esa inscripción se retira."
                        onConfirm={(reason) => voidInvoice.mutate(reason)} onClose={() => setVoiding(false)}/>
        </div>
    );
};
