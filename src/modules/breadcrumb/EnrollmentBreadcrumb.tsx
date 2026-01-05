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
        }).catch((error) => {
            setError("Error al obtener el periodo actual");
            console.error("Error al obtener el periodo actual", error);
        });
    }, []);
    useEffect(() => {
        const periodId = selectedPeriodId || currentPeriod?.id;
        if (periodId) {
            enrollmentService.getTotalByStatus(periodId).then(setStatus).catch((error) => {
                setError("Error al obtener los totales por estado");
                console.error("Error al obtener los totales por estado", error);
            });
        }
    }, [selectedPeriodId, currentPeriod]);

    return (
        <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
                <h1 className="text-xl font-medium leading-none text-gray-900">
                    Listado de Inscripciones
                </h1>
                <div className="flex items-center flex-wrap gap-2 font-medium">
                    {/* Mostrar los totales por estado de inscripción */}
                    {Object.keys(status).map((value: string, index: number) => {
                        const key = value as keyof typeof EnrollmentStatus;
                        const colorClass = EnrollmentStatusColor[key] || "bg-gray-100 text-gray-700 border-gray-300";
                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border ${colorClass}`}
                            >
                                <span className="text-sm font-medium">
                                    {EnrollmentStatusLabel[key]}:
                                </span>
                                <span className="text-sm font-semibold">
                                    {status[key]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && <ErrorMessage message={error}/>}
        </div>
    );
};
