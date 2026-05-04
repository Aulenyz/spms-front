import {useEffect, useState} from "react";
import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {PaymentService} from "../../services/payment/PaymentService.ts";
import {Payment, PaymentStatus} from "../../domain/model/payment/Payment.ts";
import {Link} from "react-router-dom";
import {Pager} from "../../components/io/input/Pager.tsx";
import {PaymentStatusPill} from "../../components/io/output/pill/PaymentStatusPill.tsx";
import {PaymentMethodPill} from "../../components/io/output/pill/PaymentMethodPill.tsx";
import {PaymentBreadcrumb} from "../breadcrumb/PaymentBreadcrumb.tsx";
import {PaymentFilter} from "../../domain/filters/payment/PaymentFilter.tsx";
import {PeriodService} from "../../services/period/PeriodService.ts";
import {ErrorMessage} from "../../components/io/output/ErrorMessage.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";

const paymentService: PaymentService = PaymentService.instance;
const periodService: PeriodService = PeriodService.instance;

export const ListPaymentPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [payments, setPayments]: State<Page<Payment>> = useState(Pagination.empty<Payment>());
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<KeyValueOf<string>>({
        status: "PAID",
    });
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

    useEffect(() => {
        periodService.current().then((period) => {
            if (!period?.id) {
                setSelectedPeriodId(null);
                return;
            }

            setSelectedPeriodId(period.id);
            setFilters((prev) => ({
                ...prev,
                periodId: period.id.toString(),
            }));
        }, () => {
            setError("Error al obtener el periodo actual");
        });
    }, []);

    useEffect(() => {
        paymentService.getAll(filters, pagination).then((result) => {
            setPayments(result as Page<Payment>);
        }, () => {
            setError("Error al obtener los pagos");
        });
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleUpdateFilter = (incoming: KeyValueOf<string>) => {
        const nextFilters = {...incoming};

        if (!incoming.periodId) {
            delete nextFilters.periodId;
            setSelectedPeriodId(null);
        } else {
            setSelectedPeriodId(Number(incoming.periodId));
        }

        setFilters(nextFilters);
        handlePageChange(0);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Pagos"
                description="Consulta ventas, metodo de pago y estado de cada transaccion desde una vista ordenada."
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
                        <th scope="col">Metodo</th>
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

                    {payments.content.map((payment, index) => (
                        <tr key={index}>
                            <td><strong>{payment.identifier}</strong></td>
                            <td>${payment.amount.toFixed(2)}</td>
                            <td><PaymentMethodPill method={payment.method}/></td>
                            <td><PaymentStatusPill status={payment.status}/></td>
                            <td>{payment.user.info.name}</td>
                            <td className="text-right">
                                <Link to="#" className="table-link whitespace-nowrap">
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs"/>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>
        </div>
    );
};
