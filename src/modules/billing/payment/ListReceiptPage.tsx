import {useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {Link} from "react-router-dom";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ReceiptService} from "../../../services/billing/BillingService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {formatDate, money, PaymentMethod, PaymentMethodLabel, Receipt, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {useDebouncedValue} from "../../../hooks/useDebouncedValue.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {PaymentMethodTag, ReceiptStatusPill} from "../components/BillingPills.tsx";
import {ListToolbar} from "../components/ListToolbar.tsx";
import {RegisterPaymentModal} from "./RegisterPaymentModal.tsx";

const EMPTY_PAGE: Page<Receipt> = Pagination.empty<Receipt>();

export const ListReceiptPage = () => {
    const {hasAuthority} = useAuthContext();
    const [term, setTerm] = useState("");
    const [method, setMethod] = useState<PaymentMethod | "">("");
    const [status, setStatus] = useState<ReceiptStatus | "">(ReceiptStatus.PAID);
    const [pagination, setPagination] = useState<Pagination>(Pagination.ofSize(10));
    const [paying, setPaying] = useState(false);
    const debouncedTerm = useDebouncedValue(term);
    const filters = {term: debouncedTerm, method: method || undefined, status: status || undefined};

    const receiptsQuery = useQuery({
        queryKey: [...queryKeys.payments.all, "list", {filters, pagination}],
        queryFn: ({signal}) => ReceiptService.instance.withSignal(signal).search(filters, pagination),
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar los pagos."},
    });
    const receipts = receiptsQuery.data ?? EMPTY_PAGE;
    const loading = receiptsQuery.isPending || (receiptsQuery.isFetching && receiptsQuery.isPlaceholderData);
    const resetPage = () => setPagination((current) => ({...current, page: 0}));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pagos recibidos"
                description="Cada pago genera un recibo que puedes imprimir o anular si hubo un error."
                actions={hasAuthority(AuthorityKey.COLLECTION_CREATE) ? (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying(true)}>
                        <i className="fa fa-receipt"/>Registrar pago
                    </button>
                ) : undefined}
            />

            <DataTableCard
                title="Recibos"
                description="Los más recientes primero."
                filters={
                    <ListToolbar term={term} placeholder="Buscar por recibo, estudiante o referencia"
                                 onTerm={(value) => {
                                     setTerm(value);
                                     resetPage();
                                 }}>
                        <select className="select select-bordered select-sm" value={method} aria-label="Forma de pago"
                                onChange={(event) => {
                                    setMethod(event.target.value as PaymentMethod | "");
                                    resetPage();
                                }}>
                            <option value="">Todas las formas de pago</option>
                            {Object.values(PaymentMethod).map((value) => <option key={value} value={value}>{PaymentMethodLabel[value]}</option>)}
                        </select>
                        <select className="select select-bordered select-sm" value={status} aria-label="Estado"
                                onChange={(event) => {
                                    setStatus(event.target.value as ReceiptStatus | "");
                                    resetPage();
                                }}>
                            <option value={ReceiptStatus.PAID}>Cobrados</option>
                            <option value={ReceiptStatus.VOIDED}>Anulados</option>
                            <option value="">Todos</option>
                        </select>
                    </ListToolbar>
                }
                footer={!loading ? (
                    <Pager page={receipts} onChange={(page) => setPagination((current) => ({...current, page}))}
                           onPageSizeChange={(size) => setPagination((current) => ({...current, page: 0, size}))}/>
                ) : undefined}
            >
                <LoadingContent loading={loading} className="min-h-[280px]">
                    {receipts.content.length === 0 ? (
                        <EmptyState title="No hay pagos para mostrar" icon="fa-hand-holding-dollar"
                                    description="Registra un pago con el botón «Registrar pago»."/>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table-shell min-w-[820px]">
                                <thead>
                                <tr>
                                    <th>Recibo</th>
                                    <th>Estudiante</th>
                                    <th>Forma de pago</th>
                                    <th className="text-right">Monto</th>
                                    <th>Estado</th>
                                    <th className="w-12"/>
                                </tr>
                                </thead>
                                <tbody>
                                {receipts.content.map((receipt) => (
                                    <tr key={receipt.id}>
                                        <td>
                                            <Link to={`/payments/${receipt.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">{receipt.number}</Link>
                                            <span className="block text-xs text-[var(--text-tertiary)]">{formatDate(receipt.date)}</span>
                                        </td>
                                        <td>
                                            <Link to={`/accounts/${receipt.student.id}`} className="hover:text-[var(--accent)]">{receipt.student.name}</Link>
                                            {receipt.guardian && <span className="block text-xs text-[var(--text-tertiary)]">Pagó {receipt.guardian.name}</span>}
                                        </td>
                                        <td>
                                            <PaymentMethodTag method={receipt.method}/>
                                            {receipt.reference && <span className="block text-xs text-[var(--text-tertiary)]">Ref. {receipt.reference}</span>}
                                        </td>
                                        <td className="text-right font-semibold text-[var(--text-primary)]">{money.format(receipt.amount)}</td>
                                        <td><ReceiptStatusPill status={receipt.status}/></td>
                                        <td className="text-right">
                                            <Link to={`/payments/${receipt.id}`} className="row-action" title="Ver recibo" aria-label="Ver recibo">
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

            <RegisterPaymentModal isOpen={paying} onClose={() => setPaying(false)}/>
        </div>
    );
};
