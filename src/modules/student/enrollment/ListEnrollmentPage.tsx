import {useEffect, useState} from "react";
import {EnrollmentService} from "../../../services/student/enrollment/EnrollmentService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {Enrollment, EnrollmentStatus} from "../../../domain/student/Enrollment.ts";
import {toast} from "react-toastify";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {Link} from "react-router-dom";
import {EnrollmentStatusPill} from "../../../components/io/output/pill/EnrollmentStatusPill.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {EnrollmentBreadcrumb} from "../../breadcrumb/EnrollmentBreadcrumb.tsx";
import {EnrollmentFilter} from "../../../domain/filters/student/EnrollmentFilter.tsx";
import {AlertTable} from "../../../components/io/AlertTable.tsx";
import {PeriodService} from "../../../services/period/PeriodService.ts";

const enrollmentService: EnrollmentService = EnrollmentService.instance;
const periodService: PeriodService = PeriodService.instance;

export const ListEnrollmentPage = () => {
    const [enrollments, setEnrollments] = useState<Page<Enrollment>>(Pagination.empty<Enrollment>());
    const [pagination, setPagination] = useState<Pagination>(Pagination.first);
    const [filters, setFilters] = useState<{ active: boolean; periodId?: number; periodName?: string; status: EnrollmentStatus }>({active: true, status: EnrollmentStatus.ENROLLED,});
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [isPeriodLoaded, setIsPeriodLoaded] = useState(false);

    useEffect(() => {
        periodService.current()
            .then((period) => {
                if (period?.id) {
                    setFilters((f) => ({
                        ...f,
                        periodId: period.id,
                        periodName: period.name,
                    }));
                }
            })
            .catch(() => toast.error("No se pudo obtener el período activo."))
            .finally(() => setIsPeriodLoaded(true));
    }, []);

    useEffect(() => {
        if (!isPeriodLoaded) return;
        loadEnrollments(pagination, filters);
    }, [pagination, filters, isPeriodLoaded]);

    const loadEnrollments = (pagination: Pagination, filters: Record<string, any>) => {
        setIsPageLoading(true);
        enrollmentService
            .getAll(filters, pagination)
            .then(setEnrollments)
            .catch(() => toast.error("Error cargando las inscripciones"))
            .finally(() => setIsPageLoading(false));
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleFilterChange = (newFilters: Record<string, any>) => {
        setFilters((current) => ({
            ...current,
            ...newFilters,
            periodId: newFilters.periodId ?? current.periodId,
            status: newFilters.status ?? current.status,
        }));
        setPagination(Pagination.first);
    };

    return (
        <div className="pt-6 pl-9 pr-5">
            <div>
                <EnrollmentBreadcrumb selectedPeriodId={filters.periodId}/>
            </div>

            <div className="card relative overflow-x-auto mb-6 border border-gray-200 rounded-md shadow-sm">
                {isPageLoading && (
                    <div
                        className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50 rounded-lg">
                        <LoadingContent loading={true}/>
                    </div>
                )}

                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Mostrando Inscripciones:</span>
                        <EnrollmentStatusPill
                            status={filters.status as EnrollmentStatus}/>
                    </h3>
                    <EnrollmentFilter onFilter={handleFilterChange}/>
                </div>

                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Fecha</th>
                        <th scope="col" className="px-6 py-3">Documento</th>
                        <th scope="col" className="px-6 py-3">Nombre</th>
                        <th scope="col" className="px-6 py-3">Apellido</th>
                        <th scope="col" className="px-6 py-3">Curso</th>
                        <th scope="col" className="px-6 py-3">Estatus</th>
                        <th scope="col" className="px-3 py-3 w-[5%]"></th>
                    </tr>
                    </thead>

                    {!isPageLoading && enrollments?.content.length === 0 ? (
                        <AlertTable
                            message={'No se encontraron inscripciones con los filtros seleccionados'}
                            insideTable={true}
                        />
                    ) : !isPageLoading && (
                        <tbody>
                        {enrollments.content.map((enrollment: Enrollment, index: number) => (
                            <tr key={index}
                                className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition align-middle">
                                <td className="px-6 py-3">
                                    {enrollment.date ? new Date(enrollment.date).toLocaleDateString() : "---"}
                                </td>
                                <td className="px-6 py-3">{enrollment.student.document}</td>
                                <td className="px-6 py-3">{enrollment.student.firstname}</td>
                                <td className="px-6 py-3">{enrollment.student.lastname}</td>
                                <td className="px-6 py-3">
                                    {enrollment.course?.grade}{" "}
                                    {enrollment.course?.division && `(${enrollment.course.division})`}
                                </td>
                                <td className="px-6 py-3">
                                    <EnrollmentStatusPill status={enrollment.status}/>
                                </td>
                                <td className="px-3 py-3 text-right">
                                    <Link
                                        to={`/enrollments/${enrollment.id}`}
                                        className="font-medium text-blue-600 hover:underline whitespace-nowrap">
                                        Detalles
                                        <i className="fa fa-chevron-right text-2xs ms-1"/>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    )}
                </table>

                <div>
                    <Pager onChange={handlePageChange} page={enrollments}/>
                </div>
            </div>
        </div>
    );
};
