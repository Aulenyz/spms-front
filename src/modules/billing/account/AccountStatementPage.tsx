import {ReactNode, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import clsx from "clsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {AccountService, InvoiceService, ReceiptService} from "../../../services/billing/BillingService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {formatDate, money, invoiceLink, receiptLink} from "../../../domain/billing/Invoice.ts";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {ExportExcelButton} from "../../../components/ui/data/ExportExcelButton.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {InvoiceStatusPill, PaymentMethodTag, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {RegisterPaymentModal} from "../payment/RegisterPaymentModal.tsx";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import {StudentService} from "../../../services/student/StudentService.ts";
import {RelationshipLabel} from "../../../domain/student/Guardian.ts";

type Tab = "movements" | "invoices" | "receipts";
const TABS: {key: Tab; label: string; icon: string}[] = [
    {key: "movements", label: "Movimientos", icon: "fa-list"},
    {key: "invoices", label: "Facturas", icon: "fa-file-invoice-dollar"},
    {key: "receipts", label: "Recibos", icon: "fa-receipt"},
];
const PAGE_SIZE = 10;

/** Lista de una pestaña: tabla, vacío, carga y paginación con el mismo diseño en las tres. */
const PagedSection = <T, >({title, description, query, empty, actions, onPage, children}: {
    title: string;
    description?: string;
    query: {data?: Page<T>; isPending: boolean};
    empty: string;
    actions: ReactNode;
    onPage: (page: number) => void;
    children: (rows: T[]) => ReactNode;
}) => (
    <DetailSection title={title} description={description} actions={actions} flush>
        {query.isPending ? <LoadingContent loading className="py-12"><span/></LoadingContent>
            : !query.data || query.data.content.length === 0 ? (
                <p className="p-5 text-sm" style={{color: "var(--text-tertiary)"}}>{empty}</p>
            ) : (
                <>
                    <div className="overflow-x-auto">{children(query.data.content)}</div>
                    <div className="border-t px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                        <Pager page={query.data} onChange={onPage}/>
                    </div>
                </>
            )}
    </DetailSection>
);

/**
 * Estado de cuenta de un estudiante: los totales vienen del servidor en una sola consulta y cada lista
 * (movimientos, facturas y recibos) se pide aparte, filtrada por el estudiante y de 10 en 10.
 */
export const AccountStatementPage = () => {
    const {studentId = ""} = useParams();
    const navigate = useNavigate();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<Tab>("movements");
    const [paying, setPaying] = useState(false);
    const [movementsPage, setMovementsPage] = useState(0);
    const [invoicesPage, setInvoicesPage] = useState(0);
    const [receiptsPage, setReceiptsPage] = useState(0);
    const studentFilter = {studentId: Number(studentId)};
    const pageOf = (page: number): Pagination => ({...Pagination.ofSize(PAGE_SIZE), page});

    // Un estudiante puede tener varios representantes: se muestran todos con su parentesco
    const guardiansQuery = useQuery({
        queryKey: [...queryKeys.students.all, "guardians", studentId],
        queryFn: ({signal}) => StudentService.instance.withSignal(signal).guardians(Number(studentId)),
        meta: {silent: true},
    });
    const statementQuery = useQuery({
        queryKey: queryKeys.accounts.statement(studentId),
        queryFn: ({signal}) => AccountService.instance.withSignal(signal).statement(studentId),
        meta: {errorMessage: "No se pudo cargar el estado de cuenta."},
    });
    const movementsQuery = useQuery({
        queryKey: [...queryKeys.accounts.statement(studentId), "movements", movementsPage],
        queryFn: ({signal}) => AccountService.instance.withSignal(signal).movements(studentId, pageOf(movementsPage)),
        enabled: tab === "movements",
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar los movimientos."},
    });
    const invoicesQuery = useQuery({
        queryKey: queryKeys.invoices.list({filters: studentFilter, page: invoicesPage, size: PAGE_SIZE}),
        queryFn: ({signal}) => InvoiceService.instance.withSignal(signal).search(studentFilter, pageOf(invoicesPage)),
        enabled: tab === "invoices",
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar las facturas."},
    });
    const receiptsQuery = useQuery({
        queryKey: queryKeys.payments.list({filters: studentFilter, page: receiptsPage, size: PAGE_SIZE}),
        queryFn: ({signal}) => ReceiptService.instance.withSignal(signal).search(studentFilter, pageOf(receiptsPage)),
        enabled: tab === "receipts",
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar los recibos."},
    });
    const statement = statementQuery.data;

    if (statementQuery.isPending) return <LoadingContent loading className="min-h-[320px]"><span/></LoadingContent>;
    if (!statement) return <EmptyState title="Estudiante no encontrado" icon="fa-scale-balanced" description="Revisa el enlace."/>;

    const fileName = (list: string) => `${list}-${statement.student.name}`;

    return (
        <div className="space-y-6">
            <DetailHeader
                avatar={statement.student.name}
                title={statement.student.name}
                subtitle={<>
                    <PermittedLink authority={AuthorityKey.STUDENTS_VIEW} to={`/students/${statement.student.id}`}
                                   className="hover:text-[var(--accent)] hover:underline">Matrícula {statement.student.document}</PermittedLink>
                    {(guardiansQuery.data ?? []).length > 0 && (
                        <span className="block">
                            {(guardiansQuery.data ?? []).length === 1 ? "Representante: " : "Representantes: "}
                            {(guardiansQuery.data ?? []).map(({guardian, relationship}) =>
                                `${guardian.firstname} ${guardian.lastname} (${RelationshipLabel[relationship] ?? relationship})`).join(" · ")}
                        </span>
                    )}
                </>}
                badges={Number(statement.due) > 0
                    ? <span className={`billing-pill billing-pill-${Number(statement.overdue) > 0 ? "danger" : "warning"}`}>
                        {Number(statement.overdue) > 0 ? "Con atraso" : "Con saldo"}
                      </span>
                    : <span className="billing-pill billing-pill-success">Al día</span>}
                actions={Number(statement.due) > 0 && hasAuthority(AuthorityKey.COLLECTION_CREATE) ? (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying(true)}>
                        <i className="fa fa-receipt"/>Registrar pago
                    </button>
                ) : undefined}
            />

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

            <div className="section-tabs">
                {TABS.map((item) => (
                    <button key={item.key} type="button" onClick={() => setTab(item.key)}
                            className={clsx("section-tab", {"section-tab-active": tab === item.key})}>
                        <i className={`fa ${item.icon}`}/>{item.label}
                    </button>
                ))}
            </div>

            {tab === "movements" && (
                <PagedSection title="Movimientos" description="Cargos y pagos, del más reciente al más antiguo, con el saldo acumulado."
                              query={movementsQuery} empty="Sin movimientos." onPage={setMovementsPage}
                              actions={<ExportExcelButton dateRange fileName={fileName("movimientos")}
                                                          fetchFile={(range) => AccountService.instance.exportMovements(studentId, range!)}/>}>
                    {(movements) => (
                        <table className="table-shell min-w-[640px]">
                            <thead>
                            <tr><th>Fecha</th><th>Documento</th><th>Descripción</th><th className="text-right">Cargo</th><th className="text-right">Pago</th><th className="text-right">Saldo</th></tr>
                            </thead>
                            <tbody>
                            {movements.map((movement) => (
                                <tr key={`${movement.type}-${movement.documentId}`}>
                                    <td className="whitespace-nowrap">{formatDate(movement.date)}</td>
                                    <td className="whitespace-nowrap">
                                        <Link to={movement.type === "INVOICE" ? invoiceLink(movement.document) : receiptLink(movement.document)}
                                              className="font-semibold hover:text-[var(--accent)]">{movement.document}</Link>
                                    </td>
                                    <td>{movement.description ?? "—"}</td>
                                    <td className="text-right">{movement.charge ? money.format(movement.charge) : ""}</td>
                                    <td className="text-right" style={{color: "var(--success)"}}>{movement.payment ? money.format(movement.payment) : ""}</td>
                                    <td className="text-right font-semibold">{money.format(movement.balance)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </PagedSection>
            )}

            {tab === "invoices" && (
                <PagedSection title="Facturas" query={invoicesQuery} empty="Sin facturas." onPage={setInvoicesPage}
                              actions={<ExportExcelButton dateRange fileName={fileName("facturas")}
                                                          fetchFile={(range) => InvoiceService.instance.exportExcel({...studentFilter, ...range})}/>}>
                    {(invoices) => (
                        <table className="table-shell min-w-[640px]">
                            <thead><tr><th>Factura</th><th>Vence</th><th className="text-right">Total</th><th className="text-right">Saldo</th><th>Estado</th></tr></thead>
                            <tbody>
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="cursor-pointer" onClick={() => navigate(invoiceLink(invoice.number))}>
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
                        </table>
                    )}
                </PagedSection>
            )}

            {tab === "receipts" && (
                <PagedSection title="Recibos" query={receiptsQuery} empty="Sin pagos registrados." onPage={setReceiptsPage}
                              actions={<ExportExcelButton dateRange fileName={fileName("recibos")}
                                                          fetchFile={(range) => ReceiptService.instance.exportExcel({...studentFilter, ...range})}/>}>
                    {(receipts) => (
                        <table className="table-shell min-w-[640px]">
                            <thead><tr><th>Recibo</th><th>Fecha</th><th>Forma de pago</th><th className="text-right">Monto</th><th>Estado</th></tr></thead>
                            <tbody>
                            {receipts.map((receipt) => (
                                <tr key={receipt.id} className="cursor-pointer" onClick={() => navigate(receiptLink(receipt.number))}>
                                    <td className="font-semibold">{receipt.number}</td>
                                    <td className="whitespace-nowrap">{formatDate(receipt.date)}</td>
                                    <td><PaymentMethodTag method={receipt.method}/></td>
                                    <td className="text-right">{money.format(receipt.amount)}</td>
                                    <td><ReceiptStatusPill status={receipt.status}/></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </PagedSection>
            )}

            <RegisterPaymentModal isOpen={paying} student={statement.student} onClose={() => {
                setPaying(false);
                void queryClient.invalidateQueries({queryKey: queryKeys.accounts.statement(studentId)});
            }}/>
        </div>
    );
};
