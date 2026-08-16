import {useEffect, useState} from "react";
import {PeriodService} from "../../../services/period/PeriodService.ts";
import {EnrollmentService} from "../../../services/student/enrollment/EnrollmentService.ts";
import {toast} from "react-toastify";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {TableDetailAction} from "../../../components/ui/data/TableDetailAction.tsx";
import {EnrollmentStatusPill} from "../../../components/io/output/pill/EnrollmentStatusPill.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {EnrollmentBreadcrumb} from "../../breadcrumb/EnrollmentBreadcrumb.tsx";
import {EnrollmentFilter} from "../../../domain/filters/student/EnrollmentFilter.tsx";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {Enrollment, EnrollmentStatus} from "../../../domain/student/Enrollment.ts";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";

const periodService: PeriodService = PeriodService.instance;
const enrollmentService: EnrollmentService = EnrollmentService.instance;

export const ListEnrollmentPage = () => {
    const [enrollments, setEnrollments] = useState<Page<Enrollment>>(Pagination.empty<Enrollment>());
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
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [isPeriodLoaded, setIsPeriodLoaded] = useState(false);

    useEffect(() => {
        periodService.current()
            .then((period) => {
                if (period?.id) {
                    setFilters((current) => ({
                        ...current,
                        periodId: period.id,
                        periodName: period.name,
                    }));
                }
            })
            .catch(() => toast.error("No se pudo obtener el periodo activo"))
            .finally(() => setIsPeriodLoaded(true));
    }, []);

    useEffect(() => {
        if (!isPeriodLoaded) {
            return;
        }

        setIsPageLoading(true);
        enrollmentService.getAll(filters, pagination)
            .then(setEnrollments)
            .catch(() => toast.error("Error cargando las inscripciones"))
            .finally(() => setIsPageLoading(false));
    }, [pagination, filters, isPeriodLoaded]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleFilterChange = (newFilters: Record<string, any>) => {
        setFilters((current) => ({
            ...current,
            ...newFilters,
            periodId: newFilters.periodId ?? current.periodId,
            status: newFilters.status ?? current.status,
        }));
        setPagination((prev) => ({...prev, page: 0}));
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Listado de inscripciones"
                description="Revisa altas por periodo, curso y estado desde una tabla unificada."
            />

            <EnrollmentBreadcrumb selectedPeriodId={filters.periodId}/>

            <DataTableCard
                className="relative"
                title="Inscripciones"
                description="Filtra por estado y periodo para localizar registros del ciclo activo."
                status={<EnrollmentStatusPill status={filters.status as EnrollmentStatus}/>}
                filters={<EnrollmentFilter onFilter={handleFilterChange} selectedPeriodId={filters.periodId || ""}/>}
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
                        <th scope="col">Nombre</th>
                        <th scope="col">Apellido</th>
                        <th scope="col">Curso</th>
                        <th scope="col">Estado</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>

                    {!isPageLoading && enrollments.content.length === 0 ? (
                        <tbody>
                        <tr>
                            <td colSpan={7}>
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
                        {enrollments.content.map((enrollment: Enrollment, index: number) => (
                            <tr key={index}>
                                <td>{enrollment.date ? new Date(enrollment.date).toLocaleDateString() : "---"}</td>
                                <td><strong>{enrollment.student.document}</strong></td>
                                <td>{enrollment.student.firstname}</td>
                                <td>{enrollment.student.lastname}</td>
                                <td>{enrollment.course.specialization?.name}{" "}{enrollment.course?.division && `(${enrollment.course.division})`}</td>
                                <td><EnrollmentStatusPill status={enrollment.status}/></td>
                                <td className="text-right">
                                    <TableDetailAction to={`/enrollments/${enrollment.id}`}/>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    )}
                </table>
            </DataTableCard>
        </div>
    );
};
