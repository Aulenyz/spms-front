import {useEffect, useState} from "react";
import {PaymentService} from "../../services/payment/PaymentService";
import {State} from "../../domain/types/steoreotype.ts";
import {PaymentStatus, PaymentStatusLabel, statusColors} from "../../domain/model/payment/Payment";

const paymentService: PaymentService = PaymentService.instance;

export const PaymentBreadcrumb = ({selectedPeriodId}: { selectedPeriodId?: number }) => {
    const [status, setStatus]: State<Record<PaymentStatus, number>> = useState<Record<PaymentStatus, number>>({} as Record<PaymentStatus, number>);

    useEffect(() => {
        if (selectedPeriodId) {
            paymentService.getTotalByStatus(selectedPeriodId).then(setStatus).catch((error) => {
                console.error("Error al obtener los totales por estado", error);
            });
        }
    }, [selectedPeriodId]);

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
            style={{
                borderColor: "var(--border-soft)",
                background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                {Object.keys(status).map((value: string, index: number) => {
                    const key = value as keyof typeof PaymentStatus;
                    const colorClass = statusColors[key] || "bg-gray-100 text-gray-700 border-gray-300";
                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${colorClass}`}
                        >
                            <span className="text-sm font-medium">
                                {PaymentStatusLabel[key]}:
                            </span>
                            <span className="text-sm font-semibold">
                                {status[key]}
                            </span>
                        </div>
                    );
                })}
            </div>

            <a className="btn btn-sm bg-green-500 text-white hover:bg-green-600 rounded-md" href="#">
                <i className="fa fa-file-excel me-1"/>
                Exportar pagos
            </a>
        </div>
    );
};
