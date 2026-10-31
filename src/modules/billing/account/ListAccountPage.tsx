import {useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {AccountService} from "../../../services/billing/BillingService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {AccountBalance, formatDate, money} from "../../../domain/billing/Invoice.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {useDebouncedValue} from "../../../hooks/useDebouncedValue.ts";
import {ListToolbar} from "../components/ListToolbar.tsx";

const EMPTY_PAGE: Page<AccountBalance> = Pagination.empty<AccountBalance>();

export const ListAccountPage = () => {
    const [term, setTerm] = useState("");
    const [withDebt, setWithDebt] = useState(true);
    const [pagination, setPagination] = useState<Pagination>(Pagination.ofSize(10));
    const debouncedTerm = useDebouncedValue(term);

    const accountsQuery = useQuery({
        queryKey: queryKeys.accounts.list({term: debouncedTerm, withDebt, pagination}),
        queryFn: ({signal}) => AccountService.instance.withSignal(signal).balances(debouncedTerm, withDebt, pagination),
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar los estados de cuenta."},
    });
    const accounts = accountsQuery.data ?? EMPTY_PAGE;
    const loading = accountsQuery.isPending || (accountsQuery.isFetching && accountsQuery.isPlaceholderData);

    return (
        <div className="space-y-6">
            <PageHeader title="Estados de cuenta"
                        description="Cuánto se le ha facturado a cada estudiante, cuánto ha pagado y cuánto debe."/>

            <DataTableCard
                title="Saldos por estudiante"
                description="Ordenados de mayor a menor deuda."
                filters={
                    <ListToolbar term={term} placeholder="Buscar estudiante por nombre o documento"
                                 onTerm={(value) => {
                                     setTerm(value);
                                     setPagination((current) => ({...current, page: 0}));
                                 }}>
                        <label className="flex items-center gap-2 text-sm" style={{color: "var(--text-secondary)"}}>
                            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={withDebt}
                                   onChange={(event) => {
                                       setWithDebt(event.target.checked);
                                       setPagination((current) => ({...current, page: 0}));
                                   }}/>
                            Solo con deuda
                        </label>
                    </ListToolbar>
                }
                footer={!loading ? (
                    <Pager page={accounts} onChange={(page) => setPagination((current) => ({...current, page}))}
                           onPageSizeChange={(size) => setPagination((current) => ({...current, page: 0, size}))}/>
                ) : undefined}
            >
                <LoadingContent loading={loading} className="min-h-[280px]">
                    {accounts.content.length === 0 ? (
                        <EmptyState title={withDebt ? "Nadie tiene deudas" : "No hay estados de cuenta"} icon="fa-scale-balanced"
                                    description={withDebt ? "Todas las facturas están al día." : "Aparecen al facturar a un estudiante."}/>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-shell min-w-[820px]">
                                <thead>
                                <tr>
                                    <th>Estudiante</th>
                                    <th className="text-right">Facturado</th>
                                    <th className="text-right">Pagado</th>
                                    <th className="text-right">Saldo</th>
                                    <th className="text-right">Vencido</th>
                                    <th>Debe desde</th>
                                    <th className="w-12"/>
                                </tr>
                                </thead>
                                <tbody>
                                {accounts.content.map((account) => (
                                    <tr key={account.studentId}>
                                        <td>
                                            <Link to={`/accounts/${account.studentId}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                                                {account.firstname} {account.lastname}
                                            </Link>
                                            <span className="block text-xs text-[var(--text-tertiary)]">
                                                {account.document}{account.openInvoices > 0 && ` · ${account.openInvoices} ${account.openInvoices === 1 ? "factura pendiente" : "facturas pendientes"}`}
                                            </span>
                                        </td>
                                        <td className="text-right">{money.format(account.billed)}</td>
                                        <td className="text-right">{money.format(account.paid)}</td>
                                        <td className="text-right font-semibold text-[var(--text-primary)]">{money.format(account.due)}</td>
                                        <td className="text-right" style={{color: Number(account.overdue) > 0 ? "var(--danger)" : undefined}}>
                                            {Number(account.overdue) > 0 ? money.format(account.overdue) : "—"}
                                        </td>
                                        <td>{account.oldestDueDate ? formatDate(account.oldestDueDate) : "Al día"}</td>
                                        <td className="text-right">
                                            <Link to={`/accounts/${account.studentId}`} className="row-action" title="Ver estado de cuenta" aria-label="Ver estado de cuenta">
                                                <i className="fa fa-chevron-right"/>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </LoadingContent>
            </DataTableCard>
        </div>
    );
};
