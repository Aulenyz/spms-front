import {useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import clsx from "clsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {AccountService} from "../../../services/billing/BillingService.ts";
import {formatDate, money} from "../../../domain/billing/Invoice.ts";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {InvoiceStatusPill, PaymentMethodTag, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {RegisterPaymentModal} from "../payment/RegisterPaymentModal.tsx";
import {NewInvoiceModal} from "../invoice/NewInvoiceModal.tsx";

type Tab = "movements" | "invoices" | "receipts";
const TABS: {key: Tab; label: string; icon: string}[] = [
    {key: "movements", label: "Movimientos", icon: "fa-list"},
    {key: "invoices", label: "Facturas", icon: "fa-file-invoice-dollar"},
    {key: "receipts", label: "Recibos", icon: "fa-receipt"},
];

/** Estado de cuenta de un estudiante: saldo, movimientos con saldo acumulado, facturas y recibos. */
export const AccountStatementPage = () => {
    const {studentId = ""} = useParams();
    const navigate = useNavigate();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>("movements");
    const [paying, setPaying] = useState(false);
    const [invoicing, setInvoicing] = useState(false);

    const statementQuery = useQuery({
        queryKey: queryKeys.accounts.statement(studentId),
        queryFn: ({signal}) => AccountService.instance.withSignal(signal).statement(studentId),
        meta: {errorMessage: "No se pudo cargar el estado de cuenta."},
    });
    const statement = statementQuery.data;

    if (statementQuery.isPending) return <LoadingContent loading className="min-h-[320px]"><span/></LoadingContent>;
    if (!statement) return <EmptyState title="Estudiante no encontrado" icon="fa-scale-balanced" description="Revisa el enlace."/>;

    const refresh = () => void queryClient.invalidateQueries({queryKey: queryKeys.accounts.statement(studentId)});

    return (
        <div className="space-y-6">
            <div className="no-print">
                <DetailHeader
                    avatar={statement.student.name}
                    title={statement.student.name}
                    subtitle={<>{statement.student.document}{statement.guardian && ` · Tutor: ${statement.guardian.name}`}</>}
                    badges={Number(statement.due) > 0
                        ? <span className={`billing-pill billing-pill-${Number(statement.overdue) > 0 ? "danger" : "warning"}`}>
                            {Number(statement.overdue) > 0 ? "Con atraso" : "Con saldo"}
                          </span>
                        : <span className="billing-pill billing-pill-success">Al día</span>}
                    backTo="/accounts/list"
                    backLabel="Estados de cuenta"
                    actions={<>
                        <button type="button" className="btn btn-sm" onClick={() => window.print()}><i className="fa fa-print"/>Imprimir</button>
                        {hasAuthority(AuthorityKey.INVOICE_CREATE) && (
                            <button type="button" className="btn btn-sm" onClick={() => setInvoicing(true)}><i className="fa fa-plus"/>Facturar</button>
                        )}
                        {Number(statement.due) > 0 && hasAuthority(AuthorityKey.COLLECTION_CREATE) && (
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying(true)}>
                                <i className="fa fa-receipt"/>Registrar pago
                            </button>
                        )}
                    </>}
                />
            </div>

            <div className="printable space-y-6">
                <h2 className="hidden text-xl font-bold print:block">Estado de cuenta · {statement.student.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {label: "Facturado", value: statement.billed, tone: undefined},
                        {label: "Pagado", value: statement.paid, tone: "var(--success)"},
                        {label: "Saldo", value: statement.due, tone: Number(statement.due) > 0 ? "var(--text-primary)" : undefined},
                        {label: "Vencido", value: statement.overdue, tone: Number(statement.overdue) > 0 ? "var(--danger)" : undefined},
                    ].map((item) => (
                        <div key={item.label} className="rounded-[20px] border px-5 py-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>{item.label}</span>
                            <strong className="mt-1 block text-2xl" style={{color: item.tone ?? "var(--text-secondary)"}}>{money.format(item.value)}</strong>
                        </div>
                    ))}
                </div>

                <div className="section-tabs no-print">
                    {TABS.map((item) => (
                        <button key={item.key} type="button" onClick={() => setTab(item.key)}
                                className={clsx("section-tab", {"section-tab-active": tab === item.key})}>
                            <i className={`fa ${item.icon}`}/>{item.label}
                        </button>
                    ))}
                </div>

                {tab === "movements" && (
                    <DetailSection title="Movimientos" description="Cargos y pagos, del más reciente al más antiguo, con el saldo acumulado." flush>
                        {statement.movements.length === 0 ? (
                            <p className="p-5 text-sm" style={{color: "var(--text-tertiary)"}}>Sin movimientos.</p>
                        ) : (
                            <div className="overflow-x-auto"><table className="table-shell min-w-[640px]">
                                <thead>
                                <tr><th>Fecha</th><th>Documento</th><th>Descripción</th><th className="text-right">Cargo</th><th className="text-right">Pago</th><th className="text-right">Saldo</th></tr>
                                </thead>
                                <tbody>
                                {statement.movements.map((movement) => (
                                    <tr key={`${movement.type}-${movement.documentId}`}>
                                        <td className="whitespace-nowrap">{formatDate(movement.date)}</td>
                                        <td className="whitespace-nowrap">
                                            <Link to={movement.type === "INVOICE" ? `/invoices/${movement.documentId}` : `/payments/${movement.documentId}`}
                                                  className="font-semibold hover:text-[var(--accent)]">{movement.document}</Link>
                                        </td>
                                        <td>{movement.description ?? "—"}</td>
                                        <td className="text-right">{movement.charge ? money.format(movement.charge) : ""}</td>
                                        <td className="text-right" style={{color: "var(--success)"}}>{movement.payment ? money.format(movement.payment) : ""}</td>
                                        <td className="text-right font-semibold">{money.format(movement.balance)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table></div>
                        )}
                    </DetailSection>
                )}

                {tab === "invoices" && (
                    <DetailSection title="Facturas" flush>
                        {statement.invoices.length === 0 ? (
                            <p className="p-5 text-sm" style={{color: "var(--text-tertiary)"}}>Sin facturas.</p>
                        ) : (
                            <div className="overflow-x-auto"><table className="table-shell min-w-[640px]">
                                <thead><tr><th>Factura</th><th>Vence</th><th className="text-right">Total</th><th className="text-right">Saldo</th><th>Estado</th></tr></thead>
                                <tbody>
                                {statement.invoices.map((invoice) => (
                                    <tr key={invoice.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                        <td>
                                            <span className="font-semibold">{invoice.description || invoice.number}</span>
                                            <span className="block text-xs text-[var(--text-tertiary)]">{invoice.number}</span>
                                        </td>
                                        <td className="whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                                        <td className="text-right">{money.format(invoice.total)}</td>
                                        <td className="text-right font-semibold">{money.format(invoice.due)}</td>
                                        <td><InvoiceStatusPill status={invoice.status}/></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table></div>
                        )}
                    </DetailSection>
                )}

                {tab === "receipts" && (
                    <DetailSection title="Recibos" flush>
                        {statement.receipts.length === 0 ? (
                            <p className="p-5 text-sm" style={{color: "var(--text-tertiary)"}}>Sin pagos registrados.</p>
                        ) : (
                            <div className="overflow-x-auto"><table className="table-shell min-w-[640px]">
                                <thead><tr><th>Recibo</th><th>Fecha</th><th>Forma de pago</th><th className="text-right">Monto</th><th>Estado</th></tr></thead>
                                <tbody>
                                {statement.receipts.map((receipt) => (
                                    <tr key={receipt.id} className="cursor-pointer" onClick={() => navigate(`/payments/${receipt.id}`)}>
                                        <td className="font-semibold">{receipt.number}</td>
                                        <td className="whitespace-nowrap">{formatDate(receipt.date)}</td>
                                        <td><PaymentMethodTag method={receipt.method}/></td>
                                        <td className="text-right">{money.format(receipt.amount)}</td>
                                        <td><ReceiptStatusPill status={receipt.status}/></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table></div>
                        )}
                    </DetailSection>
                )}
            </div>

            <RegisterPaymentModal isOpen={paying} student={statement.student} onClose={() => {
                setPaying(false);
                refresh();
            }}/>
            <NewInvoiceModal isOpen={invoicing} student={statement.student} onClose={() => setInvoicing(false)}
                             onCreated={(id) => navigate(`/invoices/${id}`)}/>
        </div>
    );
};
