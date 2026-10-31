import {useCallback, useMemo, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {Link} from "react-router-dom";

import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {Course, GradeType} from "../../domain/model/course/Course.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {CourseService} from "../../services/course/CourseService.ts";
import {useCurrentPeriod} from "../../hooks/queries/useCurrentPeriod.ts";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {CourseFilter} from "../../domain/filters/course/CourseFilter.tsx";
import {GradeTypePill} from "../../components/io/output/pill/GradeTypePill.tsx";
import {QuickCourseModal} from "./CourseQuickForms.tsx";

const courseService = CourseService.instance;
const EMPTY_PAGE: Page<Course> = Pagination.empty<Course>();

export const ListCoursePage = () => {
    const queryClient = useQueryClient();
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.ofSize(10));
    const [filters, setFilters] = useState<KeyValueOf<string>>({active: "true"});
    // undefined: usar el periodo actual; null: sin periodo; número: periodo elegido en el filtro.
    const [chosenPeriodId, setChosenPeriodId] = useState<number | null | undefined>(undefined);
    const [showQuickCourse, setShowQuickCourse] = useState(false);
    const currentPeriod = useCurrentPeriod({silent: true});

    const selectedPeriodId: number | null = chosenPeriodId !== undefined ? chosenPeriodId : (currentPeriod.data?.id ?? null);
    const periodResolved: boolean = chosenPeriodId !== undefined || !currentPeriod.isPending || currentPeriod.fetchStatus === "idle";

    const queryFilters: KeyValueOf<string> = useMemo(() => {
        const {periodId: _ignored, ...rest} = filters;
        void _ignored;
        return selectedPeriodId ? {...rest, periodId: String(selectedPeriodId)} : rest;
    }, [filters, selectedPeriodId]);

    const {data: courses = EMPTY_PAGE} = useQuery({
        queryKey: queryKeys.courses.list({filters: queryFilters, pagination}),
        queryFn: ({signal}) => courseService.withSignal(signal).getAll(queryFilters, pagination),
        enabled: periodResolved,
        placeholderData: keepPreviousData,
    });

    const handlePageChange = (page: number) => setPagination((prev) => ({...prev, page}));

    const handlePageSizeChange = (size: number) => setPagination((prev) => ({...prev, page: 0, size}));

    const handleUpdateFilter = useCallback((incoming: KeyValueOf<string>) => {
        const nextFilters = {...incoming};

        if (!incoming.periodId) {
            delete nextFilters.periodId;
            setChosenPeriodId(null);
        } else {
            setChosenPeriodId(Number(incoming.periodId));
        }

        if (!incoming.specializationId) delete nextFilters.specializationId;
        if (!incoming.name) delete nextFilters.name;
        nextFilters.active = String(incoming.active ?? true);

        setFilters(nextFilters);
        setPagination((prev) => ({...prev, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Cursos"
                description="Consulta cursos creados por periodo, estado y área especializada desde una sola vista."
                actions={<button type="button" className="btn btn-sm btn-primary" onClick={() => setShowQuickCourse(true)}>
                    <i className="fa fa-bolt me-1"/>Curso rápido
                </button>}
            />

            <DataTableCard
                title="Listado de cursos"
                description="Listado de cursos, filtra por periodo, estado, área y nombre"
                filters={<CourseFilter onFilter={handleUpdateFilter} selectedPeriodId={selectedPeriodId}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={courses}/>}
            >
                {courses.content.length === 0 ? (
                    <EmptyState
                        title="No hay cursos para mostrar"
                        description="Cambia el periodo o los filtros para ver otros registros."
                        icon="fa-book"
                    />
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {courses.content.map((course) => (
                            <Link
                                key={course.id}
                                to={`/courses/${course.id}`}
                                state={{course}}
                                className="group relative flex min-h-[158px] flex-col overflow-hidden rounded-2xl border p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                                style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}
                            >
                                <span className="absolute inset-x-0 top-0 h-1" style={{background: "var(--accent)"}}/>
                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                                          style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                        Sección {course.division ?? "-"}
                                    </span>
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${course.active ? "bg-green-500" : "bg-red-500"}`}
                                        title={course.active ? "Activo" : "Inactivo"}
                                    />
                                </div>

                                <div className="mt-4 min-h-0 flex-1">
                                    <h3 className="line-clamp-2 text-sm font-extrabold leading-snug">{course.name ?? "Curso"}</h3>
                                    <p className="mt-2 line-clamp-2 text-xs leading-5"
                                       style={{color: "var(--text-secondary)"}}>
                                        {course.specialization?.name ?? "Sin área especializada"}
                                    </p>
                                </div>

                                <div className="mt-4 border-t pt-3" style={{borderColor: "var(--border-soft)"}}>
                                    <div className="flex items-center justify-between gap-2">
                                        <GradeTypePill type={course.type as GradeType}/>
                                        <span
                                            className="flex h-8 w-8 items-center justify-center rounded-xl transition group-hover:translate-x-0.5"
                                            style={{background: "var(--surface-muted)", color: "var(--accent)"}}>
                                            <i className="fa fa-chevron-right text-[10px]"/>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </DataTableCard>
            <QuickCourseModal open={showQuickCourse} onClose={() => setShowQuickCourse(false)}
                              onSaved={() => void queryClient.invalidateQueries({queryKey: queryKeys.courses.all})}/>
        </div>
    );
};
