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
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [payments, setPayments]: State<Page<Payment>> = useState(Pagination.empty<Payment>());
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "PAID",
    });

    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

    useEffect(() => {
        periodService.current().then((period) => {
            setSelectedPeriodId(period.id);
            setFilters((prev) => ({
                ...prev,
                periodId: period.id.toString(),
            }));
        }).catch((error) => {
            setError("Error al obtener el periodo actual");
            console.error("Error al obtener el periodo actual", error);
        });
    }, []);

    useEffect(() => {
        if (selectedPeriodId) {
            paymentService.getAll(filters, pagination).then((result) => {
                setPayments(result as Page<Payment>);
            });
        }
    }, [pagination, filters, selectedPeriodId]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleUpdateFilter = (filters: KeyValueOf<string>) => {
        setFilters({...filters});
        handlePageChange(0);
        if (filters.periodId) {
            setSelectedPeriodId(Number(filters.periodId));
        }
    };

    return (
        <div className="pt-6 pl-9 pr-5">
            <div>
                <PaymentBreadcrumb selectedPeriodId={selectedPeriodId || 0}/>
            </div>

            <div className="card relative overflow-x-auto mb-6 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Mostrando Pagos / Ventas:</span>
                        <PaymentStatusPill status={filters.status as PaymentStatus}/>
                    </h3>
                    <PaymentFilter onFilter={handleUpdateFilter} selectedPeriodId={selectedPeriodId || ""}/>
                </div>

                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Identificador</th>
                        <th scope="col" className="px-6 py-3">Monto</th>
                        <th scope="col" className="px-6 py-3">Método</th>
                        <th scope="col" className="px-6 py-3">Estatus</th>
                        <th scope="col" className="px-6 py-3">Usuario</th>
                        <th scope="col" className="px-3 py-3 w-[5%]"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {payments.content.map((payment: Payment, index: number) => (
                        <tr key={index} className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                            <td className="px-6 py-3">{payment.identifier}</td>
                            <td className="px-6 py-3">${payment.amount.toFixed(2)}</td>
                            <td className="px-6 py-3">
                                <PaymentMethodPill method={payment.method}/>
                            </td>
                            <td className="px-6 py-3">
                                <PaymentStatusPill status={payment.status}/>
                            </td>
                            <td className="px-6 py-3">{payment.user.info.name}</td>
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
                <div>
                    <Pager onChange={handlePageChange} page={payments}/>
                </div>
            </div>
        </div>
    );
};
