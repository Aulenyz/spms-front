import {useCallback, useMemo, useState} from "react";
import {keepPreviousData, useQuery} from "@tanstack/react-query";
import {EnrollmentService} from "../../../services/student/enrollment/EnrollmentService.ts";
import {useCurrentPeriod} from "../../../hooks/queries/useCurrentPeriod.ts";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {PermittedLink} from "../../../components/auth/PermittedLink.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {EnrollmentStatusPill} from "../../../components/io/output/pill/EnrollmentStatusPill.tsx";
import {GradeTypePill} from "../../../components/io/output/pill/GradeTypePill.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {EnrollmentBreadcrumb} from "../../breadcrumb/EnrollmentBreadcrumb.tsx";
import {EnrollmentFilter} from "../../../domain/filters/student/EnrollmentFilter.tsx";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {Enrollment, EnrollmentStatus} from "../../../domain/student/Enrollment.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";

const enrollmentService: EnrollmentService = EnrollmentService.instance;
const EMPTY_PAGE: Page<Enrollment> = Pagination.empty<Enrollment>();

export const ListEnrollmentPage = () => {
    const [pagination, setPagination] = useState<Pagination>(Pagination.first);
    const [filters, setFilters] = useState<{
        active: boolean;
        periodId?: number;
        periodName?: string;
        status: EnrollmentStatus;
    }>({
        active: true,
        status: EnrollmentStatus.ENROLLED,
    });
    const currentPeriod = useCurrentPeriod();
    // Mientras el usuario no elija otro periodo, se usa el periodo actual.
    const effectiveFilters: typeof filters = useMemo(() => ({
        ...filters,
        periodId: filters.periodId ?? currentPeriod.data?.id,
        periodName: filters.periodName ?? currentPeriod.data?.name,
    }), [filters, currentPeriod.data]);

    const enrollmentsQuery = useQuery({
        queryKey: queryKeys.enrollments.list({filters: effectiveFilters, pagination}),
        queryFn: ({signal}) => enrollmentService.withSignal(signal).getAll(effectiveFilters, pagination),
        // Se espera a resolver el periodo actual (con o sin éxito) antes de consultar.
        enabled: !currentPeriod.isPending || currentPeriod.fetchStatus === "idle",
        placeholderData: keepPreviousData,
        meta: {errorMessage: "Error cargando las inscripciones"},
    });
    const enrollments: Page<Enrollment> = enrollmentsQuery.data ?? EMPTY_PAGE;
    const isPageLoading: boolean = enrollmentsQuery.isFetching;

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
        setFilters((current) => ({
            ...current,
            ...newFilters,
            periodId: newFilters.periodId ?? current.periodId,
            status: newFilters.status ?? current.status,
        }));
        setPagination((prev) => ({...prev, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Listado de inscripciones"
                description="Revisa altas por periodo, curso y estado desde una tabla unificada."
            />

            <EnrollmentBreadcrumb selectedPeriodId={effectiveFilters.periodId}/>

            <DataTableCard
                className="relative"
                title="Inscripciones"
                description="Filtra por estado y periodo para localizar registros del ciclo activo."
                status={<EnrollmentStatusPill status={filters.status as EnrollmentStatus}/>}
                filters={<EnrollmentFilter onFilter={handleFilterChange} selectedPeriodId={effectiveFilters.periodId || ""}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={enrollments}/>}
            >
                {isPageLoading && (
                    <div
                        className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-slate-950/10 backdrop-blur-sm">
                        <LoadingContent loading={true}/>
                    </div>
                )}

                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Fecha</th>
                        <th scope="col">Documento</th>
                        <th scope="col">Estudiante</th>
                        <th scope="col">Curso</th>
                        <th scope="col">Estado</th>
                    </tr>
                    </thead>

                    {!isPageLoading && enrollments.content.length === 0 ? (
                        <tbody>
                        <tr>
                            <td colSpan={5}>
                                <EmptyState
                                    title="No se encontraron inscripciones"
                                    description="Ajusta el periodo o el estado para mostrar otros registros."
                                    icon="fa-file-signature"
                                />
                            </td>
                        </tr>
                        </tbody>
                    ) : !isPageLoading && (
                        <tbody>
                        {enrollments.content.map((enrollment: Enrollment) => (
                            <tr key={enrollment.id}>
                                <td>{enrollment.date ? new Date(enrollment.date).toLocaleDateString() : "---"}</td>
                                <td><strong>{enrollment.student.document}</strong></td>
                                <td>
                                    <PermittedLink authority={AuthorityKey.STUDENTS_VIEW} to={`/students/${enrollment.student.id}`}
                                                   title="Ver el detalle del estudiante"
                                                   className="whitespace-nowrap font-semibold hover:text-[var(--accent)] hover:underline" style={{color: "var(--text-primary)"}}>
                                        {[enrollment.student.firstname, enrollment.student.lastname].filter(Boolean).join(" ")}
                                    </PermittedLink>
                                </td>
                                <td>
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        <span className="font-semibold" style={{color: "var(--text-primary)"}}>
                                            {enrollment.course.name} {enrollment.course.division}
                                        </span>
                                        {enrollment.course.type && <GradeTypePill type={enrollment.course.type}/>}
                                    </span>
                                    {enrollment.course.specialization?.name && (
                                        <span className="block text-xs text-[var(--text-tertiary)]">{enrollment.course.specialization.name}</span>
                                    )}
                                </td>
                                <td><EnrollmentStatusPill status={enrollment.status}/></td>
                            </tr>
                        ))}
                        </tbody>
                    )}
                </table>
            </DataTableCard>
        </div>
    );
};
