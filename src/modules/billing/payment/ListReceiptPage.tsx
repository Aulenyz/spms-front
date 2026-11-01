import {useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {ReceiptService} from "../../../services/billing/BillingService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {PaymentMethod, PaymentMethodLabel, Receipt, ReceiptStatus} from "../../../domain/billing/Invoice.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {ExportExcelButton} from "../../../components/ui/data/ExportExcelButton.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {useDebouncedValue} from "../../../hooks/useDebouncedValue.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {FilterDropdown, ListToolbar} from "../components/ListToolbar.tsx";
import {RegisterPaymentModal} from "./RegisterPaymentModal.tsx";
import {ReceiptAccordionRow, ReceiptListHeader} from "./ReceiptAccordionRow.tsx";

const EMPTY_PAGE: Page<Receipt> = Pagination.empty<Receipt>();

export const ListReceiptPage = () => {
    const {hasAuthority} = useAuthContext();
    // ?q=NÚMERO llega desde otros enlaces: filtra por ese número y lo abre.
    const [searchParams] = useSearchParams();
    const linked = searchParams.get("q") ?? "";
    const [term, setTerm] = useState(linked);
    useEffect(() => {
        if (linked) setTerm(linked);
    }, [linked]);
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
    useEffect(() => {
        const match = receipts.content.find((receipt) => receipt.number === linked);
        if (match) setOpenId(match.id);
    }, [receipts, linked]);
    const loading = receiptsQuery.isPending || (receiptsQuery.isFetching && receiptsQuery.isPlaceholderData);
    const resetPage = () => setPagination((current) => ({...current, page: 0}));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pagos recibidos"
                description="Cada pago genera un recibo que puedes imprimir o anular si hubo un error."
                actions={<>
                    <ExportExcelButton dateRange fileName="recibos"
                                       fetchFile={(range) => ReceiptService.instance.exportExcel({...filters, ...range})}/>
                    {hasAuthority(AuthorityKey.COLLECTION_CREATE) && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => setPaying(true)}>
                            <i className="fa fa-receipt"/>Registrar pago
                        </button>
                    )}
                </>}
            />

            <DataTableCard
                title="Recibos"
                description="Los más recientes primero. Toca un pago para ver todo su detalle."
                filters={
                    <ListToolbar term={term} placeholder="Recibo, estudiante o ref."
                                 onTerm={(value) => {
                                     setTerm(value);
                                     resetPage();
                                 }}>
                        <FilterDropdown text="Forma de pago" value={method} wide
                                        options={[{value: "", description: "Todas las formas"}, ...Object.values(PaymentMethod).map((value) => ({value, description: PaymentMethodLabel[value]}))]}
                                        onChange={(value) => {
                                            setMethod(value as PaymentMethod | "");
                                            resetPage();
                                        }}/>
                        <FilterDropdown text="Estado" value={status}
                                        options={[{value: ReceiptStatus.PAID, description: "Cobrados"}, {value: ReceiptStatus.VOIDED, description: "Anulados"}, {value: "", description: "Todos"}]}
                                        onChange={(value) => {
                                            setStatus(value as ReceiptStatus | "");
                                            resetPage();
                                        }}/>
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
                        <div className="min-w-[600px]">
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
