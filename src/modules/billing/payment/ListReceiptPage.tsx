import {useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ReceiptService} from "../../../services/billing/BillingService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {PaymentMethod, PaymentMethodLabel, Receipt, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {useDebouncedValue} from "../../../hooks/useDebouncedValue.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {ListToolbar} from "../components/ListToolbar.tsx";
import {RegisterPaymentModal} from "./RegisterPaymentModal.tsx";
import {ReceiptAccordionRow, ReceiptListHeader} from "./ReceiptAccordionRow.tsx";

const EMPTY_PAGE: Page<Receipt> = Pagination.empty<Receipt>();

export const ListReceiptPage = () => {
    const {hasAuthority} = useAuthContext();
    const [term, setTerm] = useState("");
    const [method, setMethod] = useState<PaymentMethod | "">("");
    const [status, setStatus] = useState<ReceiptStatus | "">(ReceiptStatus.PAID);
    const [pagination, setPagination] = useState<Pagination>(Pagination.ofSize(10));
    const [paying, setPaying] = useState(false);
    const [openId, setOpenId] = useState<number | null>(null);
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
                filtersLayout="row"
                title="Recibos"
                description="Los más recientes primero. Toca un pago para ver todo su detalle."
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
                            <option value="">Todas las formas</option>
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
                        <div className="min-w-[580px]">
                        <ReceiptListHeader/>
                        <ul>
                            {receipts.content.map((receipt) => (
                                <ReceiptAccordionRow key={receipt.id} receipt={receipt} open={openId === receipt.id}
                                                     onToggle={() => setOpenId((current) => current === receipt.id ? null : receipt.id)}/>
                            ))}
                        </ul>
                        </div>
                        </div>
                    )}
                </LoadingContent>
            </DataTableCard>

            <RegisterPaymentModal isOpen={paying} onClose={() => setPaying(false)}/>
        </div>
    );
};
