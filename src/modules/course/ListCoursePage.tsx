import {useEffect, useState} from "react";
import {Link} from "react-router-dom";

import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {Course} from "../../domain/model/course/Course.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {CourseService} from "../../services/course/CourseService.ts";
import {PeriodService} from "../../services/period/PeriodService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {CourseFilter} from "../../domain/filters/course/CourseFilter.tsx";
import {CourseActivePill} from "../../components/io/output/pill/CourseActivePill.tsx";
import {GradeType} from "../../domain/model/course/Course.ts";
import {GradeTypePill} from "../../components/io/output/pill/GradeTypePill.tsx";

const courseService = CourseService.instance;
const periodService = PeriodService.instance;

export const ListCoursePage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [courses, setCourses]: State<Page<Course>> = useState(Pagination.empty<Course>());
    const [filters, setFilters] = useState<KeyValueOf<string>>({active: "true"});
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

    useEffect(() => {
        periodService.current().then((period) => {
            if (!period?.id) {
                setSelectedPeriodId(null);
                return;
            }
            setSelectedPeriodId(period.id);
            setFilters((prev) => ({...prev, periodId: String(period.id)}));
        }).catch(() => setSelectedPeriodId(null));
    }, []);

    useEffect(() => {
        courseService.getAll(filters as any, pagination).then(setCourses);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => setPagination((prev) => ({...prev, page}));

    const handlePageSizeChange = (size: number) => setPagination((prev) => ({...prev, page: 0, size}));

    const handleUpdateFilter = (incoming: KeyValueOf<string>) => {
        const nextFilters = {...incoming};

        if (!incoming.periodId) {
            delete nextFilters.periodId;
            setSelectedPeriodId(null);
        } else {
            setSelectedPeriodId(Number(incoming.periodId));
        }

        if (!incoming.specializationId) delete nextFilters.specializationId;
        nextFilters.active = String(incoming.active ?? true);

        setFilters(nextFilters);
        handlePageChange(0);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Cursos"
                description="Consulta cursos creados por periodo, estado y área especializada desde una sola vista."
            />

            <DataTableCard
                title="Listado de cursos"
                description="Filtra por periodo para ver las secciones y su área especializada."
                status={<span className="page-header-eyebrow">Registros: {courses.content.length}</span>}
                filters={<CourseFilter onFilter={handleUpdateFilter} selectedPeriodId={selectedPeriodId}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={courses}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Nombre</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">División</th>
                        <th scope="col">Área especializada</th>
                        <th scope="col">Estado</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {courses.content.length === 0 && (
                        <tr>
                            <td colSpan={6}>
                                <EmptyState
                                    title="No hay cursos para mostrar"
                                    description="Cambia el periodo o los filtros para ver otros registros."
                                    icon="fa-book"
                                />
                            </td>
                        </tr>
                    )}

                    {courses.content.map((course, index) => (
                        <tr key={index}>
                            <td><strong>{course.name ?? "-"}</strong></td>
                            <td><GradeTypePill type={course.type as GradeType}/></td>
                            <td><strong>{course.division}</strong></td>
                            <td>{course.specialization?.name ?? "-"}</td>
                            <td><CourseActivePill active={Boolean(course.active)}/></td>
                            <td className="text-right">
                                <Link to={`/courses/${course.id}`} state={{course}} className="table-link whitespace-nowrap">
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
