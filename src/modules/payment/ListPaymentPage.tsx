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

const paymentService: PaymentService = PaymentService.instance;
const periodService: PeriodService = PeriodService.instance;

export const ListPaymentPage = () => {
    const [pagination, setPagination]: State<Pagination> =
        useState(Pagination.first);

    const [payments, setPayments]: State<Page<Payment>> =
        useState(Pagination.empty<Payment>());

    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<KeyValueOf<string>>({
        status: "PAID",
    });

    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

    useEffect(() => {
        periodService
            .current()
            .then((period) => {
                if (!period || !period.id) {
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
            })
    }, []);

    useEffect(() => {
        paymentService.getAll(filters, pagination)
            .then((result) => {
                setPayments(result as Page<Payment>);
            }, () => {
                setError("Error al obtener los pagos");
            });
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
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
        <div className="pt-6 pl-9 pr-5">
            <PaymentBreadcrumb selectedPeriodId={selectedPeriodId || 0}/>

            <div className="card relative overflow-x-auto mb-6 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Mostrando Ventas:</span>
                        <PaymentStatusPill status={filters.status as PaymentStatus}/>
                    </h3>
                    <PaymentFilter onFilter={handleUpdateFilter} selectedPeriodId={selectedPeriodId}/>
                </div>

                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Identificador</th>
                        <th className="px-6 py-3">Monto</th>
                        <th className="px-6 py-3">Método</th>
                        <th className="px-6 py-3">Estatus</th>
                        <th className="px-6 py-3">Usuario</th>
                        <th className="px-3 py-3 w-[5%]"/>
                    </tr>
                    </thead>
                    <tbody>
                    {payments.content.map((payment, index) => (
                        <tr
                            key={index}
                            className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition"
                        >
                            <td className="px-6 py-3">
                                {payment.identifier}
                            </td>
                            <td className="px-6 py-3">
                                ${payment.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-3">
                                <PaymentMethodPill method={payment.method}/>
                            </td>
                            <td className="px-6 py-3">
                                <PaymentStatusPill status={payment.status}/>
                            </td>
                            <td className="px-6 py-3">
                                {payment.user.info.name}
                            </td>
                            <td className="px-3 py-3 text-right">
                                <Link to="#" className="font-medium text-blue-600 hover:underline whitespace-nowrap">
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs ms-1"/>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {error && <ErrorMessage message={error}/>}
                <Pager onChange={handlePageChange} page={payments}/>
            </div>
        </div>
    );
};
