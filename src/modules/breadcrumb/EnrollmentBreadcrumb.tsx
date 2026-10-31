import {useQuery} from "@tanstack/react-query";
import {EnrollmentService} from "../../services/student/enrollment/EnrollmentService.ts";
import {EnrollmentStatus, EnrollmentStatusColor, EnrollmentStatusLabel} from "../../domain/student/Enrollment.ts";
import {ErrorMessage} from "../../components/io/output/ErrorMessage.tsx";
import {useCurrentPeriod} from "../../hooks/queries/useCurrentPeriod.ts";
import {queryKeys} from "../../app/query/queryKeys.ts";

const enrollmentService: EnrollmentService = EnrollmentService.instance;
const EMPTY_TOTALS = {} as Record<EnrollmentStatus, number>;

export const EnrollmentBreadcrumb = ({selectedPeriodId}: { selectedPeriodId?: number }) => {
    // Comparte la caché del periodo actual con la página (sin peticiones duplicadas).
    const currentPeriod = useCurrentPeriod({silent: true});
    const periodId = selectedPeriodId || currentPeriod.data?.id;
    const totals = useQuery({
        queryKey: queryKeys.enrollments.totals(periodId),
        queryFn: ({signal}) => enrollmentService.withSignal(signal).getTotalByStatus(periodId as number),
        enabled: Boolean(periodId),
        meta: {silent: true},
    });
    const status: Record<EnrollmentStatus, number> = totals.data ?? EMPTY_TOTALS;
    const error: string | null = currentPeriod.isError
        ? "Error al obtener el periodo actual"
        : totals.isError ? "Error al obtener los totales por estado" : null;

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
                {Object.keys(status).map((value: string) => {
                    const key = value as keyof typeof EnrollmentStatus;
                    const colorClass = EnrollmentStatusColor[key] || "bg-gray-100 text-gray-700 border-gray-300";
                    return (
                        <div
                            key={value}
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
