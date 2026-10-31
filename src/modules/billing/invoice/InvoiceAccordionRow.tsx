import {ReactNode, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService} from "../../../services/billing/BillingService.ts";
import {formatDate, Invoice, InvoiceStatus, money, PaymentMethodLabel, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import {useCurrentOrganization} from "../../shared/main/navbarQueries.ts";
import {InvoiceStatusPill, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {VoidDialog} from "../components/VoidDialog.tsx";
import {invoiceHtml, printHtml} from "../print/printDocuments.ts";
import {useBillingSettings} from "../useBillingSettings.ts";
import {RegisterPaymentModal} from "../payment/RegisterPaymentModal.tsx";

const OPEN = [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE];

/** Columnas compartidas por el encabezado y las filas: flecha, factura, vence, total, saldo, estado, acción. */
const COLUMNS = "grid grid-cols-[1.5rem_minmax(7rem,1.3fr)_minmax(6rem,1fr)_7.5rem_6.5rem_6rem] items-center gap-x-3";

export const InvoiceListHeader = () => (
    <div className={`${COLUMNS} border-b px-3 py-3 text-xs font-semibold uppercase tracking-[0.06em]`}
         style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-tertiary)"}}>
        <span/>
        <span>Factura</span>
        <span>Vence</span>
        <span className="text-right">Saldo</span>
        <span className="ps-3">Estado</span>
        <span className="text-right">Acción</span>
    </div>
);

const Field = ({label, children, wide}: {label: string; children: ReactNode; wide?: boolean}) => (
    <div className={wide ? "sm:col-span-2" : undefined}>
        <dt className="text-xs" style={{color: "var(--text-tertiary)"}}>{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold" style={{color: "var(--text-primary)"}}>{children || "—"}</dd>
    </div>
);

/** Una factura de la lista: la flecha la abre en el lugar con sus conceptos y pagos; el botón la imprime. */
export const InvoiceAccordionRow = ({invoice, open, onToggle}: {invoice: Invoice; open: boolean; onToggle: () => void}) => {
    const queryClient = useQueryClient();
    const {hasAuthority} = useAuthContext();
    const {taxesEnabled, requiresNcf} = useBillingSettings();
    const {data: organization} = useCurrentOrganization();
    const [printing, setPrinting] = useState(false);
    const [voiding, setVoiding] = useState(false);
    const [paying, setPaying] = useState(false);

    const detailsQuery = useQuery({
        queryKey: queryKeys.invoices.details(invoice.id),
        queryFn: ({signal}) => InvoiceService.instance.withSignal(signal).details(invoice.id),
        enabled: open,
        meta: {errorMessage: "No se pudo cargar la factura."},
    });
    const details = detailsQuery.data;
    const isOpen = OPEN.includes(invoice.status);
    const hasPayments = Boolean(details?.payments.some((payment) => payment.status === ReceiptStatus.PAID));

    const print = async () => {
        setPrinting(true);
        try {
            const loaded = await queryClient.fetchQuery({
                queryKey: queryKeys.invoices.details(invoice.id),
                queryFn: () => InvoiceService.instance.details(invoice.id),
            });
            printHtml(invoiceHtml(loaded, taxesEnabled, {name: organization?.name ?? "", document: organization?.document, logo: organization?.logo}));
        } catch {
            toast.error("No se pudo preparar la factura para imprimir.");
        } finally {
            setPrinting(false);
        }
    };

    const voidInvoice = useMutation({
        mutationFn: (reason: string) => InvoiceService.instance.voidInvoice(invoice.id, reason),
        onSuccess: (saved) => {
            queryClient.setQueryData(queryKeys.invoices.details(invoice.id), saved);
            [queryKeys.invoices.all, queryKeys.accounts.all, queryKeys.enrollments.all]
                .forEach((queryKey) => void queryClient.invalidateQueries({queryKey}));
            setVoiding(false);
            toast.success("Factura anulada.");
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo anular la factura."),
    });

    return (
        <li className="border-b last:border-b-0" style={{borderColor: "var(--border-soft)"}}>
            <div className={`${COLUMNS} px-3 py-3`}>
                <button type="button" onClick={onToggle} aria-expanded={open} className="row-action"
                        aria-label={open ? `Cerrar ${invoice.number}` : `Ver detalle de ${invoice.number}`}>
                    <i className={`fa fa-chevron-down text-xs transition-transform ${open ? "rotate-180" : ""}`}/>
                </button>
                <span className="min-w-0">
                    <button type="button" onClick={onToggle} className="block whitespace-nowrap text-left font-semibold hover:underline" style={{color: "var(--success)"}}>
                        {invoice.number}
                    </button>
                    {invoice.student ? (
                        <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/accounts/${invoice.student.id}`}
                                       className="block truncate text-sm hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-secondary)"}}>
                            {invoice.student.name}
                        </PermittedLink>
                    ) : <span className="text-sm" style={{color: "var(--text-tertiary)"}}>Sin estudiante</span>}
                </span>
                <span className="min-w-0">
                    <span className="block whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>{formatDate(invoice.dueDate)}</span>
                    <span className="block truncate text-xs" style={{color: "var(--text-tertiary)"}}>{invoice.description || "—"}</span>
                </span>
                <span className="text-right">
                    <span className="block whitespace-nowrap font-bold" style={{color: "var(--text-primary)"}}>{money.format(invoice.due)}</span>
                    <span className="block whitespace-nowrap text-xs" style={{color: "var(--text-tertiary)"}}>de {money.format(invoice.total)}</span>
                </span>
                <span className="ps-3"><InvoiceStatusPill status={invoice.status}/></span>
                <span className="text-right">
                    <button type="button" className="btn btn-sm px-3" disabled={printing} onClick={() => void print()}
                            aria-label={`Imprimir factura ${invoice.number}`}>
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
                                <Field label="Estudiante">{invoice.student?.name}</Field>
                                <Field label="Documento">{invoice.student?.document}</Field>
                                <Field label="Facturada a">{invoice.guardian?.name}</Field>
                                <Field label="Emitida">{formatDate(invoice.emittedAt)}</Field>
                                <Field label="Pagado">{money.format(invoice.paid)}</Field>
                                <Field label="Origen">{invoice.manual ? "Factura manual" : "Inscripción o cobro automático"}</Field>
                                {requiresNcf && <Field label="Comprobante fiscal">{invoice.ncf ?? "Sin NCF"}</Field>}

                                <div className="sm:col-span-3 xl:col-span-4">
                                    <dt className="mb-1 text-xs" style={{color: "var(--text-tertiary)"}}>Conceptos</dt>
                                    <dd className="overflow-hidden rounded-xl border" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                        <table className="w-full text-sm">
                                            <thead>
                                            <tr className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                                <th className="px-3 py-2 text-left font-semibold">Concepto</th>
                                                <th className="px-3 py-2 text-right font-semibold">Cant.</th>
                                                <th className="px-3 py-2 text-right font-semibold">Precio</th>
                                                {taxesEnabled && <th className="px-3 py-2 text-right font-semibold">Impuesto</th>}
                                                <th className="px-3 py-2 text-right font-semibold">Importe</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {details.items.map((item) => (
                                                <tr key={item.id} className="border-t" style={{borderColor: "var(--border-soft)"}}>
                                                    <td className="px-3 py-1.5 font-semibold" style={{color: "var(--text-primary)"}}>{item.description}</td>
                                                    <td className="px-3 py-1.5 text-right">{Number(item.quantity)}</td>
                                                    <td className="whitespace-nowrap px-3 py-1.5 text-right">{money.format(item.unitPrice)}</td>
                                                    {taxesEnabled && <td className="whitespace-nowrap px-3 py-1.5 text-right">{money.format(item.taxAmount)}</td>}
                                                    <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold" style={{color: "var(--text-primary)"}}>{money.format(item.amount)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </dd>
                                </div>

                                <div className="sm:col-span-3 xl:col-span-4">
                                    <dt className="mb-1 text-xs" style={{color: "var(--text-tertiary)"}}>Pagos</dt>
                                    <dd className="text-sm">
                                        {details.payments.length === 0 ? (
                                            <span style={{color: "var(--text-tertiary)"}}>Todavía no tiene pagos.</span>
                                        ) : (
                                            <span className="flex flex-wrap gap-x-5 gap-y-1">
                                                {details.payments.map((payment) => (
                                                    <span key={payment.id} className="inline-flex items-center gap-2">
                                                        <PermittedLink authority={AuthorityKey.PAYMENTS_VIEW} to="/payments/list"
                                                                       className="font-semibold hover:text-[var(--accent)] hover:underline">{payment.receiptNumber}</PermittedLink>
                                                        <span style={{color: "var(--text-secondary)"}}>
                                                            {formatDate(payment.date)} · {PaymentMethodLabel[payment.method]} · {money.format(payment.amount)}
                                                        </span>
                                                        <ReceiptStatusPill status={payment.status}/>
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                {details.voidReason && (
                                    <Field label="Anulada" wide><span style={{color: "var(--danger)"}}>{details.voidReason}</span></Field>
                                )}

                                {isOpen && (
                                    <div className="flex flex-wrap items-end justify-end gap-2 sm:col-span-3 xl:col-span-4">
                                        {hasAuthority(AuthorityKey.INVOICE_VOID) && !hasPayments && (
                                            <button type="button" className="btn btn-sm" onClick={() => setVoiding(true)}>
                                                <i className="fa fa-ban"/>Anular factura
                                            </button>
                                        )}
                                        {invoice.student && hasAuthority(AuthorityKey.COLLECTION_CREATE) && (
                                            <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying(true)}>
                                                <i className="fa fa-receipt"/>Registrar pago
                                            </button>
                                        )}
                                    </div>
                                )}
                            </dl>
                        )}
                    </div>
                </div>
            )}

            <VoidDialog isOpen={voiding} title={`Anular ${invoice.number}`} loading={voidInvoice.isPending}
                        consequence="La factura deja de cobrarse. Si es la inscripción de un estudiante pendiente, esa inscripción se retira."
                        onConfirm={(reason) => voidInvoice.mutate(reason)} onClose={() => setVoiding(false)}/>
            {paying && (
                <RegisterPaymentModal isOpen={paying} student={invoice.student} invoiceId={invoice.id} onClose={() => {
                    setPaying(false);
                    void queryClient.invalidateQueries({queryKey: queryKeys.invoices.details(invoice.id)});
                }}/>
            )}
        </li>
    );
};
