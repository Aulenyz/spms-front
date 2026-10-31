import {ReactNode, useState} from "react";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
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
export const RECEIPT_COLUMNS = "grid grid-cols-[1.5rem_minmax(7rem,1.3fr)_minmax(6rem,1fr)_7rem_6rem_6rem] items-center gap-x-3";

export const ReceiptListHeader = () => (
    <div className={`${RECEIPT_COLUMNS} border-b px-3 py-3 text-xs font-semibold uppercase tracking-[0.06em]`}
         style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-tertiary)"}}>
        <span/>
        <span>Recibo</span>
        <span>Fecha</span>
        <span className="text-right">Total</span>
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
                    <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/accounts/${receipt.student.id}`} title="Ver estado de cuenta del estudiante"
                          className="block truncate text-sm hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-secondary)"}}>
                        {receipt.student.name}
                    </PermittedLink>
                </span>
                <span className="min-w-0">
                    <span className="block whitespace-nowrap text-sm" style={{color: "var(--text-primary)"}}>{formatDate(receipt.date)}</span>
                    <span className="block truncate text-xs" style={{color: "var(--text-tertiary)"}}>{PaymentMethodLabel[receipt.method]}</span>
                </span>
                <span className={`whitespace-nowrap text-right font-bold ${voided ? "line-through" : ""}`}
                      style={{color: voided ? "var(--text-tertiary)" : "var(--text-primary)"}}>{money.format(receipt.amount)}</span>
                <span className="ps-3"><ReceiptStatusPill status={receipt.status}/></span>
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
                                <Field label="Pagado por">
                                    {receipt.guardian
                                        ? <PermittedLink authority={AuthorityKey.GUARDIANS_VIEW} to={`/guardians/${receipt.guardian.id}`}
                                                         className="hover:text-[var(--accent)] hover:underline">{receipt.guardian.name}</PermittedLink>
                                        : null}
                                </Field>
                                <Field label="Forma de pago">{PaymentMethodLabel[receipt.method]}</Field>
                                <Field label="Referencia">{receipt.reference}</Field>
                                <Field label="Total recibido">{money.format(receipt.amount)}</Field>
                                <Field label="Recibido por">
                                    {details.receivedById
                                        ? <PermittedLink authority={AuthorityKey.USER_DETAILS_VIEW} to={`/users/${details.receivedById}`}
                                                         className="hover:text-[var(--accent)] hover:underline">{details.receivedBy}</PermittedLink>
                                        : details.receivedBy}
                                </Field>
                                <Field label="Fecha de registro">{formatDate(receipt.createdAt)}</Field>
                                <div className="sm:col-span-3 xl:col-span-4">
                                    <dt className="mb-1 text-xs" style={{color: "var(--text-tertiary)"}}>Conceptos pagados</dt>
                                    <dd className="overflow-hidden rounded-xl border" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                        <table className="w-full text-sm">
                                            <thead>
                                            <tr className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                                <th className="px-3 py-2 text-left font-semibold">Concepto</th>
                                                <th className="px-3 py-2 text-left font-semibold">Factura</th>
                                                <th className="px-3 py-2 text-right font-semibold">Cant.</th>
                                                <th className="px-3 py-2 text-right font-semibold">Precio</th>
                                                <th className="px-3 py-2 text-right font-semibold">Importe</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {details.concepts.map((concept, index) => (
                                                <tr key={`${concept.invoiceId}-${index}`} className="border-t" style={{borderColor: "var(--border-soft)"}}>
                                                    <td className="px-3 py-1.5 font-semibold" style={{color: "var(--text-primary)"}}>{concept.description}</td>
                                                    <td className="px-3 py-1.5">
                                                        <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/invoices/${concept.invoiceId}`}
                                                                       className="hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-secondary)"}}>
                                                            {concept.invoiceNumber}
                                                        </PermittedLink>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">{Number(concept.quantity)}</td>
                                                    <td className="whitespace-nowrap px-3 py-1.5 text-right">{money.format(concept.unitPrice)}</td>
                                                    <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold" style={{color: "var(--text-primary)"}}>{money.format(concept.amount)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                        <div className="flex flex-wrap justify-end gap-x-5 gap-y-1 border-t px-3 py-2 text-xs" style={{borderColor: "var(--border-soft)", color: "var(--text-secondary)"}}>
                                            {details.payments.map((payment) => (
                                                <span key={payment.id}>Abonado a {payment.invoiceNumber}: <strong style={{color: "var(--text-primary)"}}>{money.format(payment.amount)}</strong></span>
                                            ))}
                                        </div>
                                    </dd>
                                </div>
                                {details.voidReason ? (
                                    <Field label="Anulado" wide>
                                        <span style={{color: "var(--danger)"}}>{formatDate(details.voidedAt)} · {details.voidReason}</span>
                                    </Field>
                                ) : (
                                    <Field label="Nota" wide>{details.notes}</Field>
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
