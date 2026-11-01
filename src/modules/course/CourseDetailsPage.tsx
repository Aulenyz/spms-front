import {useEffect, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {useParams} from "react-router-dom";
import clsx from "clsx";

import {queryKeys} from "../../app/query/queryKeys.ts";
import {useDebouncedValue} from "../../hooks/useDebouncedValue.ts";
import {CourseAcademicAssignment, GradeTypeLabel} from "../../domain/model/course/Course.ts";
import {CourseService} from "../../services/course/CourseService.ts";
import {Enrollment} from "../../domain/student/Enrollment.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {EnrollmentService} from "../../services/student/enrollment/EnrollmentService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {EnrollmentStatusPill} from "../../components/io/output/pill/EnrollmentStatusPill.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";
import {DetailHeader} from "../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../components/ui/detail/DetailSection.tsx";
import {Badge, StatusBadge} from "../../components/ui/detail/StatusBadge.tsx";
import {CourseAssignmentModal} from "./CourseQuickForms.tsx";
import {CourseWeekSchedule} from "./CourseWeekSchedule.tsx";
import {describeSlots} from "./template/schedule.ts";

type TabKey = "subjects" | "schedule" | "students";

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
    {key: "subjects", label: "Materias y profesores", icon: "fa-book-open"},
    {key: "schedule", label: "Horario", icon: "fa-calendar-week"},
    {key: "students", label: "Estudiantes", icon: "fa-user-graduate"},
];

const courseService = CourseService.instance;
const enrollmentService = EnrollmentService.instance;
const EMPTY_ENROLLMENTS: Page<Enrollment> = Pagination.empty<Enrollment>();

const studentName = (enrollment: Enrollment) =>
    `${enrollment.student?.firstname ?? ""} ${enrollment.student?.lastname ?? ""}`.trim() || "Estudiante";

export const CourseDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [studentTerm, setStudentTerm] = useState("");
    const [studentPagination, setStudentPagination] = useState<Pagination>(Pagination.ofSize(10));
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<CourseAcademicAssignment | null>(null);
    const [tab, setTab] = useState<TabKey>(() => {
        const saved = id ? localStorage.getItem(`course-details-tab-${id}`) : null;
        return TABS.some((item) => item.key === saved) ? saved as TabKey : "subjects";
    });

    useEffect(() => {
        if (id) localStorage.setItem(`course-details-tab-${id}`, tab);
    }, [id, tab]);

    const courseQuery = useQuery({
        queryKey: [...queryKeys.courses.all, "detail", id],
        queryFn: ({signal}) => courseService.withSignal(signal).getOne(id),
        enabled: Boolean(id),
        meta: {errorMessage: "No se pudo cargar el detalle del curso."},
    });
    const course = courseQuery.data;

    const debouncedStudentTerm: string = useDebouncedValue(studentTerm.trim(), 250);
    const enrollmentsQuery = useQuery({
        queryKey: [...queryKeys.enrollments.all, "by-course", id, debouncedStudentTerm, studentPagination],
        queryFn: ({signal}) => enrollmentService.withSignal(signal).byCourse(id as string, debouncedStudentTerm, studentPagination),
        enabled: Boolean(id) && tab === "students",
        placeholderData: keepPreviousData,
        meta: {errorMessage: "No se pudieron cargar los estudiantes."},
    });
    const enrollments: Page<Enrollment> = enrollmentsQuery.data ?? EMPTY_ENROLLMENTS;
    const assignments = course?.academicAssignments ?? [];
    const withoutTeacher = assignments.filter((assignment) => !assignment.teacher).length;

    const reloadCourse = () => void queryClient.invalidateQueries({queryKey: queryKeys.courses.all});
    const openAssignmentModal = (assignment?: CourseAcademicAssignment | null) => {
        setAssignmentToEdit(assignment ?? null);
        setShowAssignmentModal(true);
    };

    if (courseQuery.isLoading) return <LoadingContent loading className="py-16"/>;
    if (!course) return <EmptyState title="No se encontró el curso"
                                    description="Vuelve al listado e intenta nuevamente." icon="fa-book"/>;

    const title = `${course.name} ${course.division ? `· Sección ${course.division}` : ""}`.trim();
    const subtitle = [course.type ? GradeTypeLabel[course.type] : null, course.specialization?.name].filter(Boolean).join(" · ");

    return (
        <div className="space-y-4">
            <DetailHeader
                avatar={course.name}
                title={title}
                subtitle={subtitle || "Sin área especializada"}
                badges={<>
                    <StatusBadge active={course.active}/>
                    <Badge>{assignments.length} {assignments.length === 1 ? "materia" : "materias"}</Badge>
                    {withoutTeacher > 0 && <Badge>{withoutTeacher} sin profesor</Badge>}
                </>}
            />

            <nav className="section-tabs w-fit">
                {TABS.map((item) => (
                    <button key={item.key} type="button" onClick={() => setTab(item.key)}
                            className={clsx("section-tab", tab === item.key && "section-tab-active")}>
                        <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {tab === "subjects" && (
                <DetailSection title="Materias y profesores" flush
                               actions={<button type="button" className="btn btn-sm btn-primary" onClick={() => openAssignmentModal()}>
                                   <i className="fa fa-plus"/>Agregar materia
                               </button>}>
                    {assignments.length ? (
                        <table className="table-shell">
                            <thead>
                            <tr>
                                <th>Materia</th>
                                <th>Profesor</th>
                                <th>Horario</th>
                                <th className="w-12"/>
                            </tr>
                            </thead>
                            <tbody>
                            {assignments.map((assignment) => (
                                <tr key={assignment.id}>
                                    <td>
                                        <strong className="text-[var(--text-primary)]">{assignment.subject?.name ?? "Materia"}</strong>
                                        {assignment.subject?.code && <span className="ms-2 text-xs text-[var(--text-tertiary)]">{assignment.subject.code}</span>}
                                    </td>
                                    <td>
                                        {assignment.teacher
                                            ? <>{assignment.teacher.name}<span className="block text-xs text-[var(--text-tertiary)]">{assignment.teacher.email}</span></>
                                            : <span className="text-[var(--warning)]">Sin profesor</span>}
                                    </td>
                                    <td className="text-sm">
                                        {assignment.slots?.length
                                            ? describeSlots(assignment.slots).map((line) => <span key={line} className="block whitespace-nowrap">{line}</span>)
                                            : <span className="text-[var(--text-tertiary)]">Sin horario</span>}
                                    </td>
                                    <td className="text-right">
                                        <button type="button" className="row-action" title="Cambiar profesor"
                                                aria-label="Cambiar profesor" onClick={() => openAssignmentModal(assignment)}>
                                            <i className="fa fa-pen"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-5">
                            <EmptyState title="Sin materias" icon="fa-book"
                                        description="Agrega materias y su profesor a este curso."/>
                        </div>
                    )}
                </DetailSection>
            )}

            {tab === "schedule" && (
                <DetailSection title="Horario" description="Clases de la semana según el curso base de esta sección." flush>
                    {assignments.some((assignment) => assignment.slots?.length) ? (
                        <CourseWeekSchedule assignments={assignments}/>
                    ) : (
                        <div className="p-5">
                            <EmptyState title="Sin horario" icon="fa-calendar-week"
                                        description="Define los días y horas de cada materia en su curso base."/>
                        </div>
                    )}
                </DetailSection>
            )}

            {tab === "students" && (
                <DetailSection title="Estudiantes inscritos" flush
                               actions={<label className="input input-sm w-full sm:w-72">
                                   <i className="fa fa-search me-1 text-[var(--text-tertiary)]"/>
                                   <input value={studentTerm} placeholder="Buscar por nombre o matrícula"
                                          onChange={(event) => {
                                              setStudentTerm(event.target.value);
                                              setStudentPagination((prev) => ({...prev, page: 0}));
                                          }}/>
                               </label>}>
                    {enrollmentsQuery.isLoading ? <LoadingContent loading className="py-16"/> : enrollments.content.length ? (
                        <table className="table-shell">
                            <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Estudiante</th>
                                <th>Inscripción</th>
                            </tr>
                            </thead>
                            <tbody>
                            {enrollments.content.map((enrollment) => (
                                <tr key={enrollment.id}>
                                    <td>{enrollment.student?.document ?? "—"}</td>
                                    <td className="font-semibold text-[var(--text-primary)]">{studentName(enrollment)}</td>
                                    <td><EnrollmentStatusPill status={enrollment.status}/></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-5">
                            <EmptyState title="Sin estudiantes" icon="fa-user-graduate"
                                        description={debouncedStudentTerm ? "Nadie coincide con la búsqueda." : "Todavía no hay estudiantes inscritos en este curso."}/>
                        </div>
                    )}
                    {enrollments.content.length > 0 && (
                        <div className="border-t px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                            <Pager page={enrollments}
                                   onChange={(page) => setStudentPagination((prev) => ({...prev, page}))}
                                   onPageSizeChange={(size) => setStudentPagination((prev) => ({...prev, page: 0, size}))}/>
                        </div>
                    )}
                </DetailSection>
            )}

            <CourseAssignmentModal courseId={id} assignment={assignmentToEdit} open={showAssignmentModal}
                                   onClose={() => setShowAssignmentModal(false)} onSaved={reloadCourse}/>
        </div>
    );
};
