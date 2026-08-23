import {type ReactNode, useEffect, useMemo, useState} from "react";
import {useLocation, useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {
    Course,
    CourseAcademicAssignment,
    GradeType,
    WeekDayLabel
} from "../../domain/model/course/Course.ts";
import {CourseService} from "../../services/course/CourseService.ts";
import {GradeTypePill} from "../../components/io/output/pill/GradeTypePill.tsx";
import {Enrollment} from "../../domain/student/Enrollment.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {EnrollmentService} from "../../services/student/enrollment/EnrollmentService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {EnrollmentStatusPill} from "../../components/io/output/pill/EnrollmentStatusPill.tsx";
import {StudentGenderPill} from "../../components/io/output/pill/StudentGenderPill.tsx";
import {StudentStatusPill} from "../../components/io/output/pill/StudentStatusPill.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {formatTimeRange12} from "../../utils/timeFormat.ts";
import {CourseAssignmentModal} from "./CourseQuickForms.tsx";

type TabKey = "students" | "subjects";

type TabConfig = { key: TabKey; label: string; icon: string };

const TABS: TabConfig[] = [
    {key: "students", label: "Estudiantes", icon: "fa-user-graduate"},
    {key: "subjects", label: "Materias y profesores", icon: "fa-book-open"},
];

const courseService = CourseService.instance;
const enrollmentService = EnrollmentService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const initials = (value: string) => value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
const studentName = (enrollment: Enrollment) => `${String(enrollment.student?.firstname ?? "")} ${String(enrollment.student?.lastname ?? "")}`.trim() || "Estudiante";

export const CourseDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const location = useLocation();
    const stateCourse = (location.state as { course?: Course } | null)?.course;

    const [loading, setLoading] = useState(false);
    const [studentLoading, setStudentLoading] = useState(false);
    const [course, setCourse] = useState<Course | null>(stateCourse ?? null);
    const [studentTerm, setStudentTerm] = useState("");
    const [studentPagination, setStudentPagination] = useState<Pagination>(Pagination.ofSize(10));
    const [enrollments, setEnrollments] = useState<Page<Enrollment>>(Pagination.empty<Enrollment>());
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<CourseAcademicAssignment | null>(null);
    const [tab, setTab] = useState<TabKey>(() => {
        const saved = id ? localStorage.getItem(`course-details-tab-${id}`) : null;
        return TABS.some((item) => item.key === saved) ? saved as TabKey : "subjects";
    });

    useEffect(() => {
        if (!id) return;
        localStorage.setItem(`course-details-tab-${id}`, tab);
    }, [id, tab]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        courseService
            .getOne(id)
            .then((res) => setCourse(res ?? null))
            .catch((error) => {
                toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del curso.");
                setCourse(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const timeout = window.setTimeout(() => {
            setStudentLoading(true);
            enrollmentService
                .byCourse(id, studentTerm.trim(), studentPagination)
                .then(setEnrollments)
                .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudieron cargar los estudiantes."))
                .finally(() => setStudentLoading(false));
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [id, studentTerm, studentPagination]);

    const title = course?.name ?? course?.division ?? "Curso";
    const division = course?.division ?? "-";
    const specialization = course?.specialization?.name ?? "";
    const assignments = useMemo(() => course?.academicAssignments ?? [], [course?.academicAssignments]);

    const reloadCourse = () => {
        if (!id) return;
        courseService.getOne(id).then((res) => setCourse(res ?? null))
            .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo recargar el curso."));
    };

    const openAssignmentModal = (assignment?: CourseAcademicAssignment | null) => {
        setAssignmentToEdit(assignment ?? null);
        setShowAssignmentModal(true);
    };
    const renderStudents = () => (
        <section className="rounded-[28px] border"
                 style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
            <header className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between"
                    style={{borderColor: "var(--border-soft)"}}>
                <div>
                    <h2 className="text-base font-extrabold">Estudiantes del curso</h2>
                    <p className="mt-1 text-xs" style={{color: "var(--text-secondary)"}}>Búsqueda paginada por
                        matrícula, nombre o apellido.</p>
                </div>
                <label className="input input-sm w-full md:w-80">
                    <i className="fa fa-search me-1"/>
                    <input value={studentTerm} onChange={(event) => {
                        setStudentTerm(event.target.value);
                        setStudentPagination((prev) => ({...prev, page: 0}));
                    }} placeholder="Buscar estudiante"/>
                </label>
            </header>

            {studentLoading ?
                <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>Cargando
                    estudiantes...</div> : (
                    enrollments.content.length ? <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {enrollments.content.map((enrollment) => (
                            <article key={enrollment.id} className="rounded-2xl border p-4"
                                     style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <strong className="block truncate text-sm">{studentName(enrollment)}</strong>
                                        <p className="mt-1 text-xs"
                                           style={{color: "var(--text-secondary)"}}>Matrícula/Doc: {String(enrollment.student?.document ?? "-")}</p>
                                    </div>
                                    <EnrollmentStatusPill status={enrollment.status}/>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    {enrollment.student?.gender &&
                                        <Tag><StudentGenderPill gender={enrollment.student.gender}/></Tag>}
                                    {enrollment.student?.status &&
                                        <Tag><StudentStatusPill status={enrollment.student.status}/></Tag>}
                                </div>
                            </article>
                        ))}
                    </div> : <EmptyState title="No hay estudiantes"
                                         description="No encontramos estudiantes inscritos con esos filtros."
                                         icon="fa-user-graduate"/>
                )}

            <div className="border-t px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                <Pager
                    page={enrollments}
                    onChange={(page) => setStudentPagination((prev) => ({...prev, page}))}
                    onPageSizeChange={(size) => setStudentPagination((prev) => ({...prev, page: 0, size}))}
                />
            </div>
        </section>
    );

    const renderSubjects = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => openAssignmentModal()}>
                    <i className="fa fa-plus me-1"/>Agregar materia
                </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {assignments.map((assignment) => <SubjectCard key={assignment.id} assignment={assignment} expanded
                                                              onEdit={() => openAssignmentModal(assignment)}/>)}
                {!assignments.length && <EmptyState title="Sin materias asignadas"
                                                    description="Este curso todavía no tiene materias sincronizadas."
                                                    icon="fa-book"/>}
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) return <div className="rounded-[28px] border p-8 text-sm font-semibold"
                                 style={{borderColor: "var(--border-soft)", color: "var(--text-secondary)"}}>Cargando
            detalle del curso...</div>;
        if (!course) return <EmptyState title="No se encontró el curso"
                                        description="Vuelve al listado e intenta nuevamente." icon="fa-book"/>;
        if (tab === "students") return renderStudents();
        return renderSubjects();
    };

    return (
        <div className="space-y-5">
            <section className="relative overflow-hidden rounded-[32px] border p-6 lg:p-8" style={{
                borderColor: "var(--border-soft)",
                background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--surface)) 0%, var(--surface) 48%, color-mix(in srgb, #10b981 10%, var(--surface)) 100%)",
                boxShadow: "var(--shadow-card)"
            }}>
                <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-30"
                     style={{background: "var(--accent-soft)"}}/>
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div
                            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] text-2xl font-extrabold"
                            style={{
                                background: "var(--surface)",
                                color: "var(--accent)",
                                boxShadow: "var(--shadow-soft)"
                            }}>
                            {initials(title)}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`h-2.5 w-2.5 rounded-full ${course?.active ? "bg-green-500" : "bg-red-500"}`}
                                    title={course?.active ? "Activo" : "Inactivo"}/>
                                <span className="text-xs font-extrabold uppercase tracking-[.18em]"
                                      style={{color: "var(--accent)"}}>Curso actual</span>
                            </div>
                            <h1 className="mt-2 text-3xl font-black tracking-tight"
                                style={{color: "var(--text-primary)"}}>{title}</h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold"
                               style={{color: "var(--text-secondary)"}}>{specialization}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Tag>Sección {division}</Tag>
                                {course?.type && <GradeTypePill type={course.type as GradeType}/>}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="rounded-[26px] border p-2"
                 style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                <nav className="flex flex-wrap gap-2">
                    {TABS.map((item) => (
                        <button key={item.key} type="button" onClick={() => setTab(item.key)}
                                className={clsx("section-tab", tab === item.key && "section-tab-active")}>
                            <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {renderContent()}
            <CourseAssignmentModal courseId={id} assignment={assignmentToEdit} open={showAssignmentModal}
                                   onClose={() => setShowAssignmentModal(false)} onSaved={reloadCourse}/>
        </div>
    );
};

const Tag = ({children}: { children: ReactNode }) => (
    <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold"
          style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
        {children}
    </span>
);

const SubjectCard = ({assignment, expanded = false, onEdit}: { assignment: CourseAcademicAssignment; expanded?: boolean; onEdit?: () => void }) => (
    <article className="rounded-[24px] border p-4"
             style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <strong className="block truncate text-sm">{assignment.subject?.name ?? "Materia"}</strong>
                <p className="mt-1 text-xs"
                   style={{color: "var(--text-secondary)"}}>{assignment.subject?.code ?? assignment.subject?.description ?? "Sin código"}</p>
            </div>
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition hover:-translate-y-0.5"
                    style={{background: "var(--accent-soft)", color: "var(--accent)"}} onClick={onEdit}
                    title="Editar materia, profesor y horario">
                <i className="fa fa-pen"/>
            </button>
        </div>
        <div className="mt-4 rounded-2xl border p-3"
             style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
            <p className="text-[11px] font-extrabold uppercase tracking-[.12em]"
               style={{color: "var(--text-tertiary)"}}>Profesor</p>
            <strong className="mt-1 block text-sm">{assignment.teacher?.name ?? "Sin profesor"}</strong>
            {assignment.teacher?.email && <p className="mt-1 truncate text-xs"
                                             style={{color: "var(--text-secondary)"}}>{assignment.teacher.email}</p>}
        </div>
        {(expanded || Boolean(assignment.schedule?.length)) && <div className="mt-3 flex flex-wrap gap-2">
            {(assignment.schedule ?? []).map((slot, index) => (
                <Tag key={`${slot.dayOfWeek}-${slot.startsAt}-${index}`}>
                    {WeekDayLabel[slot.dayOfWeek]} · {formatTimeRange12(slot.startsAt, slot.endsAt)}
                </Tag>
            ))}
            {!assignment.schedule?.length && <Tag>Sin horario</Tag>}
        </div>}
    </article>
);
