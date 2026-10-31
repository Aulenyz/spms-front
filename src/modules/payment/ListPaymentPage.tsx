import {useCallback, useMemo, useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {PaymentService} from "../../services/payment/PaymentService.ts";
import {Payment, PaymentStatus} from "../../domain/model/payment/Payment.ts";
import {TableDetailAction} from "../../components/ui/data/TableDetailAction.tsx";
import {Pager} from "../../components/io/input/Pager.tsx";
import {PaymentStatusPill} from "../../components/io/output/pill/PaymentStatusPill.tsx";
import {PaymentMethodPill} from "../../components/io/output/pill/PaymentMethodPill.tsx";
import {PaymentBreadcrumb} from "../breadcrumb/PaymentBreadcrumb.tsx";
import {PaymentFilter} from "../../domain/filters/payment/PaymentFilter.tsx";
import {useCurrentPeriod} from "../../hooks/queries/useCurrentPeriod.ts";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {ErrorMessage} from "../../components/io/output/ErrorMessage.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";

const paymentService: PaymentService = PaymentService.instance;
const EMPTY_PAGE: Page<Payment> = Pagination.empty<Payment>();

export const ListPaymentPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [filters, setFilters] = useState<KeyValueOf<string>>({
        status: "PAID",
    });
    // undefined: usar el periodo actual; null: sin periodo; número: periodo elegido en el filtro.
    const [chosenPeriodId, setChosenPeriodId] = useState<number | null | undefined>(undefined);
    const currentPeriod = useCurrentPeriod({silent: true});

    const selectedPeriodId: number | null = chosenPeriodId !== undefined ? chosenPeriodId : (currentPeriod.data?.id ?? null);
    // Se espera a resolver el periodo actual antes de consultar los pagos (evita una consulta sin periodo).
    const periodResolved: boolean = chosenPeriodId !== undefined || !currentPeriod.isPending || currentPeriod.fetchStatus === "idle";

    const queryFilters: KeyValueOf<string> = useMemo(() => {
        const {periodId: _ignored, ...rest} = filters;
        void _ignored;
        return selectedPeriodId ? {...rest, periodId: selectedPeriodId.toString()} : rest;
    }, [filters, selectedPeriodId]);

    const paymentsQuery = useQuery({
        queryKey: queryKeys.payments.list({filters: queryFilters, pagination}),
        queryFn: ({signal}) => paymentService.withSignal(signal).getAll(queryFilters, pagination) as Promise<Page<Payment>>,
        enabled: periodResolved,
        placeholderData: keepPreviousData,
        meta: {silent: true},
    });
    const payments: Page<Payment> = paymentsQuery.data ?? EMPTY_PAGE;
    const error: string | null = currentPeriod.isError
        ? "Error al obtener el periodo actual"
        : paymentsQuery.isError ? "Error al obtener los pagos" : null;

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleUpdateFilter = useCallback((incoming: KeyValueOf<string>) => {
        const nextFilters = {...incoming};

        if (!incoming.periodId) {
            delete nextFilters.periodId;
            setChosenPeriodId(null);
        } else {
            setChosenPeriodId(Number(incoming.periodId));
        }

        setFilters(nextFilters);
        setPagination((prev) => ({...prev, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pagos"
                description="Consulta ventas, método de pago y estado de cada transaccion desde una vista ordenada."
            />

            <PaymentBreadcrumb selectedPeriodId={selectedPeriodId || 0}/>

            <DataTableCard
                title="Listado de pagos"
                description="Filtra y revisa los cobros registrados en el periodo seleccionado."
                status={<PaymentStatusPill status={filters.status as PaymentStatus}/>}
                filters={<PaymentFilter onFilter={handleUpdateFilter} selectedPeriodId={selectedPeriodId}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={payments}/>}
            >
                {error && <ErrorMessage message={error}/>}

                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Identificador</th>
                        <th scope="col">Monto</th>
                        <th scope="col">Método</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Usuario</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {payments.content.length === 0 && (
                        <tr>
                            <td colSpan={6}>
                                <EmptyState
                                    title="No hay pagos para mostrar"
                                    description="Cambia el periodo o el estado para localizar otros registros."
                                    icon="fa-wallet"
                                />
                            </td>
                        </tr>
                    )}

                    {payments.content.map((payment) => (
                        <tr key={payment.identifier}>
                            <td><strong>{payment.identifier}</strong></td>
                            <td>${payment.amount.toFixed(2)}</td>
                            <td><PaymentMethodPill method={payment.method}/></td>
                            <td><PaymentStatusPill status={payment.status}/></td>
                            <td>{payment.user.info.name}</td>
                            <td className="text-right">
                                <TableDetailAction disabled/>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>
        </div>
    );
};
