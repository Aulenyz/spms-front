import {useState} from "react";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvoiceService, AccountService} from "../../../services/billing/BillingService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {formatDate, Invoice, InvoiceStatus, InvoiceStatusLabel, money} from "../../../domain/billing/Invoice.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {useDebouncedValue} from "../../../hooks/useDebouncedValue.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {InvoiceStatusPill} from "../components/BillingPills.tsx";
import {FilterDropdown, ListToolbar} from "../components/ListToolbar.tsx";
import {NewInvoiceModal} from "./NewInvoiceModal.tsx";

const invoiceService = InvoiceService.instance;
const EMPTY_PAGE: Page<Invoice> = Pagination.empty<Invoice>();

export const ListInvoicePage = () => {
    const {hasAuthority} = useAuthContext();
    const canCreate = hasAuthority(AuthorityKey.INVOICE_CREATE);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [term, setTerm] = useState("");
    const [status, setStatus] = useState<InvoiceStatus | "">("");
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState<Pagination>(Pagination.ofSize(10));
    const [creating, setCreating] = useState(false);
    const debouncedTerm = useDebouncedValue(term);
    const filters = {term: debouncedTerm, status: status || undefined, open: open || undefined};

    const invoicesQuery = useQuery({
        queryKey: queryKeys.invoices.list({filters, pagination}),
        queryFn: ({signal}) => invoiceService.withSignal(signal).search(filters, pagination),
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar las facturas."},
    });
    const invoices = invoicesQuery.data ?? EMPTY_PAGE;
    const loading = invoicesQuery.isPending || (invoicesQuery.isFetching && invoicesQuery.isPlaceholderData);

    const recurring = useMutation({
        mutationFn: () => AccountService.instance.runRecurring(),
        onSuccess: (result) => {
            toast.success(result.invoices > 0
                ? `Se generaron ${result.invoices} facturas de cobros recurrentes.`
                : "No hay cobros recurrentes pendientes por facturar.");
            void queryClient.invalidateQueries({queryKey: queryKeys.invoices.all});
            void queryClient.invalidateQueries({queryKey: queryKeys.accounts.all});
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudieron generar los cobros."),
    });

    const resetPage = () => setPagination((current) => ({...current, page: 0}));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Facturas"
                description="Todo lo que se ha cobrado a los estudiantes: inscripciones, mensualidades y ventas."
                actions={canCreate ? (
                    <>
                        <button type="button" className="btn btn-sm" disabled={recurring.isPending} onClick={() => recurring.mutate()}
                                title="Factura ahora los conceptos de cobro automático que ya vencieron">
                            {recurring.isPending ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-rotate"/>}
                            Generar cobros pendientes
                        </button>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setCreating(true)}>
                            <i className="fa fa-plus"/>Nueva factura
                        </button>
                    </>
                ) : undefined}
            />

            <DataTableCard
                title="Facturas emitidas"
                description="Las más recientes primero. Abre una para ver sus conceptos y pagos."
                filters={
                    <ListToolbar term={term} placeholder="Factura o estudiante"
                                 onTerm={(value) => {
                                     setTerm(value);
                                     resetPage();
                                 }}>
                        <FilterDropdown text="Estado" value={status}
                                        options={[{value: "", description: "Todos"}, ...Object.values(InvoiceStatus)
                                            .filter((value) => value !== InvoiceStatus.CANCELLED)
                                            .map((value) => ({value, description: InvoiceStatusLabel[value]}))]}
                                        onChange={(value) => {
                                            setStatus(value as InvoiceStatus | "");
                                            resetPage();
                                        }}/>
                        <FilterDropdown text="Saldo" value={open ? "open" : "all"}
                                        options={[{value: "all", description: "Todas"}, {value: "open", description: "Con saldo"}]}
                                        onChange={(value) => {
                                            setOpen(value === "open");
                                            resetPage();
                                        }}/>
                    </ListToolbar>
                }
                footer={!loading ? (
                    <Pager page={invoices} onChange={(page) => setPagination((current) => ({...current, page}))}
                           onPageSizeChange={(size) => setPagination((current) => ({...current, page: 0, size}))}/>
                ) : undefined}
            >
                <LoadingContent loading={loading} className="min-h-[280px]">
                    {invoices.content.length === 0 ? (
                        <EmptyState title="No hay facturas para mostrar" icon="fa-file-invoice-dollar"
                                    description="Las facturas se crean al inscribir, con los cobros automáticos o con «Nueva factura»."/>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-shell min-w-[860px]">
                                <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Estudiante</th>
                                    <th>Vence</th>
                                    <th className="text-right">Total</th>
                                    <th className="text-right">Saldo</th>
                                    <th>Estado</th>
                                    <th className="w-12"/>
                                </tr>
                                </thead>
                                <tbody>
                                {invoices.content.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td>
                                            <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/invoices/${invoice.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                                                {invoice.description || invoice.number}
                                            </PermittedLink>
                                            <span className="block text-xs text-[var(--text-tertiary)]">{invoice.number}{invoice.ncf && ` · NCF ${invoice.ncf}`}</span>
                                        </td>
                                        <td>
                                            {invoice.student ? (
                                                <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/accounts/${invoice.student.id}`} className="hover:text-[var(--accent)]">{invoice.student.name}</PermittedLink>
                                            ) : "—"}
                                        </td>
                                        <td className="whitespace-nowrap">{formatDate(invoice.dueDate)}</td>
                                        <td className="text-right">{money.format(invoice.total)}</td>
                                        <td className="text-right font-semibold text-[var(--text-primary)]">{money.format(invoice.due)}</td>
                                        <td><InvoiceStatusPill status={invoice.status}/></td>
                                        <td className="text-right">
                                            <PermittedLink authority={AuthorityKey.INVOICES_VIEW} to={`/invoices/${invoice.id}`} className="row-action" title="Ver factura" aria-label="Ver factura">
                                                <i className="fa fa-chevron-right"/>
                                            </PermittedLink>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </LoadingContent>
            </DataTableCard>

            <NewInvoiceModal isOpen={creating} onClose={() => setCreating(false)}
                             onCreated={(id) => navigate(`/invoices/${id}`)}/>
        </div>
    );
};
