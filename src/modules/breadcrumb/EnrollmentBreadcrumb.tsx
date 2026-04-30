import {useEffect, useState} from "react";
import {EnrollmentService} from "../../services/student/enrollment/EnrollmentService.ts";
import {EnrollmentStatus, EnrollmentStatusColor, EnrollmentStatusLabel} from "../../domain/student/Enrollment.ts";
import {State} from "../../domain/types/steoreotype.ts";
import {PeriodService} from "../../services/period/PeriodService.ts";
import {Period} from "../../domain/model/organization/Organization.tsx";
import {ErrorMessage} from "../../components/io/output/ErrorMessage.tsx";

const enrollmentService: EnrollmentService = EnrollmentService.instance;
const periodService: PeriodService = PeriodService.instance;

export const EnrollmentBreadcrumb = ({selectedPeriodId}: { selectedPeriodId?: number }) => {
    const [status, setStatus]: State<Record<EnrollmentStatus, number>> = useState<Record<EnrollmentStatus, number>>({} as Record<EnrollmentStatus, number>);
    const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        periodService.current().then((period) => {
            setCurrentPeriod(period);
        }).catch((currentError) => {
            setError("Error al obtener el periodo actual");
            console.error("Error al obtener el periodo actual", currentError);
        });
    }, []);

    useEffect(() => {
        const periodId = selectedPeriodId || currentPeriod?.id;
        if (periodId) {
            enrollmentService.getTotalByStatus(periodId).then(setStatus).catch((statusError) => {
                setError("Error al obtener los totales por estado");
                console.error("Error al obtener los totales por estado", statusError);
            });
        }
    }, [selectedPeriodId, currentPeriod]);

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
                    const key = value as keyof typeof EnrollmentStatus;
                    const colorClass = EnrollmentStatusColor[key] || "bg-gray-100 text-gray-700 border-gray-300";
                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${colorClass}`}
                        >
                            <span className="text-sm font-medium">{EnrollmentStatusLabel[key]}:</span>
                            <span className="text-sm font-semibold">{status[key]}</span>
                        </div>
                    );
                })}
            </div>

            {error && <ErrorMessage message={error}/>}
        </div>
    );
};
