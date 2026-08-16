import {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import {CourseTemplate, GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {Subject} from "../../../domain/model/course/Subject.ts";
import {
    AcademicAssignment,
    CourseTemplateService,
    ScheduleSlot,
    TeacherAssignment,
    TeacherOption,
    TemplateSubject,
    WeekDay,
} from "../../../services/course/CourseTemplateService.ts";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {CourseTemplateForm} from "./CourseTemplateForm.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";

const service = CourseTemplateService.instance;
const DAYS: Array<{ key: WeekDay; label: string; short: string }> = [
    {key: "MONDAY", label: "Lunes", short: "Lun"},
    {key: "TUESDAY", label: "Martes", short: "Mar"},
    {key: "WEDNESDAY", label: "Miércoles", short: "Mié"},
    {key: "THURSDAY", label: "Jueves", short: "Jue"},
    {key: "FRIDAY", label: "Viernes", short: "Vie"},
];
const EMPTY_FORM = {division: "A", subjectId: "", teacherId: "", schedule: [] as ScheduleSlot[]};
const initials = (name: string) => name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message : fallback;
const time = (value: string) => value?.slice(0, 5);
type AcademicTab = "subjects" | "teachers" | "calendar";
type FormMode = "subject" | "teacher";

export const CourseTemplateDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const {hasAuthority} = useAuthContext();
    const [template, setTemplate] = useState<CourseTemplate | null>(null);
    const [assignments, setAssignments] = useState<AcademicAssignment[]>([]);
    const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [templateSubjects, setTemplateSubjects] = useState<TemplateSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showAssignment, setShowAssignment] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [teacherFilter, setTeacherFilter] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [activeTab, setActiveTab] = useState<AcademicTab>("subjects");
    const [formMode, setFormMode] = useState<FormMode>("subject");
    const [templateSubjectTerm, setTemplateSubjectTerm] = useState("");
    const [subjectToRemove, setSubjectToRemove] = useState<TemplateSubject | null>(null);
    const [removingSubject, setRemovingSubject] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [teacherToChange, setTeacherToChange] = useState<TeacherAssignment | null>(null);
    const [replacementTeacherId, setReplacementTeacherId] = useState("");
    const [changingTeacher, setChangingTeacher] = useState(false);

    const canView = hasAuthority(AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW);
    const canEdit = hasAuthority(AuthorityKey.COURSE_TEMPLATE_EDIT);
    const title = template?.name ?? template?.specialization?.name ?? "Plantilla";
    const divisions = useMemo(() => Array.from({length: template?.count ?? 0}, (_, index) =>
        index < 26 ? String.fromCharCode(65 + index) : String(index + 1)), [template?.count]);
    const visibleAssignments = useMemo(() => teacherFilter
        ? assignments.filter((item) => item.teacher?.id === Number(teacherFilter)) : assignments, [assignments, teacherFilter]);
    const scheduleRows = useMemo(() => Array.from(new Set(visibleAssignments.flatMap((assignment) =>
        assignment.schedule.map((slot) => time(slot.startsAt))))).sort(), [visibleAssignments]);
    const load = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const nextTemplate = await service.getOne(id);
            setTemplate(nextTemplate ?? null);
            if (canView) {
                const [nextTeacherAssignments, nextTeachers, nextSubjects, assignedSubjects] = await Promise.all([
                    service.teacherAssignments(id), service.teacherOptions(id), service.subjectOptions(id), service.templateSubjects(id),
                ]);
                setTeacherAssignments(nextTeacherAssignments);
                setTeachers(nextTeachers);
                setSubjects(nextSubjects);
                setTemplateSubjects(assignedSubjects);
            }
        } catch (error) {
            toast.error(message(error, "No se pudo cargar la plantilla."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [id, canView]);

    useEffect(() => {
        if (activeTab !== "calendar" || !id || !canView) return;
        service.academicAssignments(id).then(setAssignments,
            () => toast.error("No se pudo cargar el calendario."));
    }, [activeTab, id, canView]);

    const searchTeachers = (term: string = "") => {
        if (!id) return;
        service.teacherOptions(id, term).then(setTeachers,
            () => toast.error("No se pudieron buscar los profesores."));
    };

    const searchSubjects = (term: string = "") => {
        if (!id) return;
        service.subjectOptions(id, term).then(setSubjects,
            () => toast.error("No se pudieron buscar las materias."));
    };

    const openSubjectForm = () => {
        setFormMode("subject");
        setForm({...EMPTY_FORM, division: divisions[0] ?? "A"});
        searchSubjects();
        setShowAssignment(true);
    };

    const openTeacherForm = () => {
        setFormMode("teacher");
        setForm({
            ...EMPTY_FORM, division: divisions[0] ?? "A",
            schedule: [{dayOfWeek: "MONDAY", startsAt: "08:00", endsAt: "09:00"}]
        });
        searchTeachers();
        setTemplateSubjectTerm("");
        setShowAssignment(true);
    };

    const addSlot = () => setForm((current) => ({
        ...current, schedule: [...current.schedule, {dayOfWeek: "MONDAY", startsAt: "08:00", endsAt: "09:00"}],
    }));
    const updateSlot = (index: number, patch: Partial<ScheduleSlot>) => setForm((current) => ({
        ...current, schedule: current.schedule.map((slot, position) => position === index ? {...slot, ...patch} : slot),
    }));
    const removeSlot = (index: number) => setForm((current) => ({
        ...current, schedule: current.schedule.filter((_, position) => position !== index),
    }));

    const saveAssignment = async () => {
        if (!id || !form.subjectId) return;
        if (form.schedule.length && !form.teacherId) {
            toast.error("Selecciona un profesor antes de agregar un horario.");
            return;
        }
        if (formMode === "teacher" && (!form.teacherId || !form.schedule.length)) {
            toast.error("Para asignar un profesor debes seleccionar la materia, el día y el horario.");
            return;
        }
        setSaving(true);
        try {
            if (formMode === "subject") {
                await service.addTemplateSubject(id, Number(form.subjectId));
                setTemplateSubjects(await service.templateSubjects(id));
            } else {
                await service.saveAcademicAssignment(id, {
                    division: form.division, templateSubjectId: Number(form.subjectId),
                    teacherId: Number(form.teacherId), schedule: form.schedule,
                });
            }
            setTeacherAssignments(await service.teacherAssignments(id));
            if (activeTab === "calendar") setAssignments(await service.academicAssignments(id));
            setShowAssignment(false);
            toast.success(formMode === "subject" ? "Materia agregada al curso." : "Profesor y horario asignados.");
        } catch (error) {
            toast.error(message(error, "No se pudo guardar la asignación."));
        } finally {
            setSaving(false);
        }
    };

    const removeSubject = async (templateSubjectId: number) => {
        if (!id) return;
        setRemovingSubject(true);
        try {
            await service.deleteTemplateSubject(id, templateSubjectId);
            setTemplateSubjects((current) => current.filter((item) => item.id !== templateSubjectId));
            setAssignments((current) => current.filter((item) => item.templateSubjectId !== templateSubjectId));
            setTeacherAssignments((current) => current.filter((item) => item.templateSubjectId !== templateSubjectId));
            setSubjectToRemove(null);
            toast.success("Materia removida del curso.");
        } catch (error) {
            toast.error(message(error, "No se pudo remover la materia."));
        } finally {
            setRemovingSubject(false);
        }
    };

    const generateCourses = async () => {
        if (!id) return;
        setGenerating(true);
        try {
            const generated = await service.generateCourses(id);
            toast.success(generated.length ? `${generated.length} cursos actualizados con sus materias y horarios.`
                : "Los cursos existentes fueron sincronizados con sus materias y horarios.");
        } catch (error) {
            toast.error(message(error, "No se pudieron generar los cursos."));
        } finally {
            setGenerating(false);
        }
    };

    const changeTeacher = async () => {
        if (!id || !teacherToChange || !replacementTeacherId) return;
        setChangingTeacher(true);
        try {
            await service.changeTeacher(id, teacherToChange.id, Number(replacementTeacherId));
            setTeacherAssignments(await service.teacherAssignments(id));
            if (activeTab === "calendar") setAssignments(await service.academicAssignments(id));
            setTeacherToChange(null);
            toast.success("Profesor actualizado correctamente.");
        } catch (error) {
            toast.error(message(error, "No se pudo cambiar el profesor."));
        } finally {
            setChangingTeacher(false);
        }
    };

    if (!loading && !template) return <EmptyState title="No se encontró la plantilla"
                                                  description="Vuelve al listado e intenta nuevamente."
                                                  icon="fa-layer-group"/>;

    return <div className="space-y-5">
        <section className="surface-card overflow-visible">
            <div className="relative flex flex-col items-center px-6 py-7 text-center"
                 style={{background: "radial-gradient(circle at top, rgba(15,98,254,.09), transparent 62%)"}}>
                {(canEdit || hasAuthority(AuthorityKey.COURSE_GENERATE)) &&
                    <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
                        <button type="button" className="icon-button h-10 w-10" title="Más acciones"
                                aria-expanded={showActions} onClick={() => setShowActions((current) => !current)}><i
                            className="fa fa-ellipsis-vertical"/></button>
                        {showActions && <div className="floating-panel right-0 top-full z-50 mt-2 w-60 text-left">
                            <div className="space-y-1 p-2">
                                {canEdit && <button type="button" className="profile-menu-item w-full" onClick={() => {
                                    setShowActions(false);
                                    setShowEdit(true);
                                }}><i className="fa fa-pen text-[var(--accent)]"/><span>Editar plantilla</span>
                                </button>}
                                {hasAuthority(AuthorityKey.COURSE_GENERATE) &&
                                    <button type="button" className="profile-menu-item w-full" disabled={generating}
                                            onClick={() => {
                                                setShowActions(false);
                                                void generateCourses();
                                            }}><i
                                        className={generating ? "fa fa-spinner fa-spin text-[var(--accent)]" : "fa fa-layer-group text-[var(--accent)]"}/><span>{generating ? "Agregando cursos..." : "Agregar cursos al período escolar"}</span>
                                    </button>}
                            </div>
                        </div>}
                    </div>}
                <span
                    className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold"
                    style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{initials(title)}</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <h1 className="text-xl font-extrabold">{title}</h1>
                </div>
                <p className="mt-2 text-sm" style={{color: "var(--text-secondary)"}}>
                    {template?.type ? GradeTypeLabel[template.type] : "Sin tipo"} · {template?.count ?? 0} secciones
                    · {template?.specialization?.name ?? "Sin especialidad"}
                </p>
            </div>
        </section>

        <section className="surface-card overflow-hidden">
            <header className="border-b p-5" style={{borderColor: "var(--border-soft)"}}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div><span className="text-xs font-extrabold uppercase tracking-[.16em]"
                               style={{color: "var(--accent)"}}>Plan académico</span>
                    </div>
                    <nav className="flex w-fit flex-wrap gap-1 rounded-2xl border p-1.5"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                        {([{key: "subjects", label: "Materias", icon: "fa-book-open"}, {
                            key: "teachers",
                            label: "Profesores",
                            icon: "fa-chalkboard-teacher"
                        }, {key: "calendar", label: "Calendario", icon: "fa-calendar-days"}] as const).map((tab) =>
                            <button key={tab.key} type="button"
                                    className={`section-tab ${activeTab === tab.key ? "section-tab-active" : ""}`}
                                    onClick={() => setActiveTab(tab.key)}><i
                                className={`fa ${tab.icon}`}/><span>{tab.label}</span></button>)}
                    </nav>
                </div>
            </header>

            <div className="p-5">
                {activeTab === "calendar" && <>
                    <div
                        className="mb-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                        <div><strong className="text-sm">Horario semanal</strong><p className="mt-1 text-xs"
                                                                                    style={{color: "var(--text-secondary)"}}>Filtra
                            por profesor para consultar su agenda individual.</p></div>
                        <div className="w-full sm:max-w-sm"><SearchSelect text="Buscar profesor en el calendario"
                                                                          hasError={false} portal
                                                                          value={teacherFilter || undefined}
                                                                          options={teachers.map((teacher) => ({
                                                                              value: teacher.id,
                                                                              description: `${teacher.name} · ${teacher.email}`
                                                                          }))}
                                                                          onSearch={searchTeachers}
                                                                          onSelect={(value) => setTeacherFilter(value?.toString() ?? "")}
                                                                          className="w-full"/></div>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border"
                         style={{borderColor: "var(--border-soft)", boxShadow: "var(--shadow-soft)"}}>
                        <div className="min-w-[980px]">
                            <div className="grid grid-cols-[78px_repeat(5,minmax(170px,1fr))] border-b"
                                 style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                <div
                                    className="flex items-center justify-center border-r text-[10px] font-extrabold uppercase tracking-wider"
                                    style={{borderColor: "var(--border-soft)", color: "var(--text-tertiary)"}}>Hora
                                </div>
                                {DAYS.map((day) => <div key={day.key}
                                                        className="border-r px-3 py-3 text-center last:border-r-0"
                                                        style={{borderColor: "var(--border-soft)"}}><strong
                                    className="text-sm">{day.label}</strong></div>)}
                            </div>
                            {scheduleRows.map((rowTime) => <div key={rowTime}
                                                                className="grid min-h-[96px] grid-cols-[78px_repeat(5,minmax(170px,1fr))] border-b last:border-b-0"
                                                                style={{borderColor: "var(--border-soft)"}}>
                                <div className="border-r px-2 pt-4 text-center text-xs font-extrabold" style={{
                                    borderColor: "var(--border-soft)",
                                    color: "var(--text-secondary)",
                                    background: "var(--surface-muted)"
                                }}>{rowTime}</div>
                                {DAYS.map((day) => <div key={day.key} className="space-y-2 border-r p-2 last:border-r-0"
                                                        style={{borderColor: "var(--border-soft)"}}>
                                    {visibleAssignments.flatMap((assignment) => assignment.schedule.filter((slot) => slot.dayOfWeek === day.key && time(slot.startsAt) === rowTime).map((slot) => ({
                                        assignment,
                                        slot
                                    }))).map(({assignment, slot}) => <article
                                        key={`${assignment.id}-${slot.dayOfWeek}-${slot.startsAt}`}
                                        className="relative overflow-hidden rounded-xl border p-3 pl-4" style={{
                                        borderColor: "color-mix(in srgb, var(--accent) 24%, var(--border-soft))",
                                        background: "color-mix(in srgb, var(--accent) 6%, var(--surface))"
                                    }}><span className="absolute inset-y-0 left-0 w-1"
                                             style={{background: "var(--accent)"}}/>
                                        <div className="flex items-start justify-between gap-2"><strong
                                            className="truncate text-xs">{assignment.subject.name}</strong><span
                                            className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold"
                                            style={{
                                                background: "var(--accent-soft)",
                                                color: "var(--accent)"
                                            }}>{assignment.division}</span></div>
                                        <p className="mt-1 text-[11px] font-bold"
                                           style={{color: "var(--accent)"}}>{time(slot.startsAt)} — {time(slot.endsAt)}</p>
                                        <p className="mt-1 truncate text-[11px]"
                                           style={{color: "var(--text-secondary)"}}>{assignment.teacher?.name}</p>
                                    </article>)}
                                </div>)}
                            </div>)}
                            {!scheduleRows.length &&
                                <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                                          style={{background: "var(--accent-soft)", color: "var(--accent)"}}><i
                                        className="fa fa-calendar-day"/></span><strong>No hay clases
                                    programadas</strong><p className="mt-1 max-w-sm text-sm"
                                                           style={{color: "var(--text-secondary)"}}>Asigna un profesor,
                                    una materia y un horario para construir el calendario semanal.</p></div>}
                        </div>
                    </div>
                </>}

                {activeTab === "subjects" &&
                    <div className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                        <div className="flex justify-end border-b p-3"
                             style={{borderColor: "var(--border-soft)"}}>{canEdit &&
                            <button className="btn btn-sm btn-primary" onClick={openSubjectForm}><i
                                className="fa fa-plus me-1"/>Agregar materia</button>}</div>
                        <table className="table-shell">
                            <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th/>
                            </tr>
                            </thead>
                            <tbody>{templateSubjects.map((item) => <tr key={item.id}>
                                <td><strong>{item.name}</strong></td>
                                <td style={{color: "var(--text-secondary)"}}>{item.description || "Sin descripción"}</td>
                                <td className="text-right">{canEdit &&
                                    <button className="table-link text-[var(--danger)]"
                                            onClick={() => setSubjectToRemove(item)}>Remover</button>}</td>
                            </tr>)}
                            {!templateSubjects.length && <tr>
                                <td colSpan={3} className="py-10 text-center"
                                    style={{color: "var(--text-secondary)"}}>Todavía no hay materias asignadas a este
                                    curso.
                                </td>
                            </tr>}</tbody>
                        </table>
                    </div>}

                {activeTab === "teachers" &&
                    <div className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                        <div className="flex justify-end border-b p-3"
                             style={{borderColor: "var(--border-soft)"}}>{canEdit &&
                            <button className="btn btn-sm btn-primary" onClick={openTeacherForm}><i
                                className="fa fa-user-plus me-1"/>Asignar profesor</button>}</div>
                        <table className="table-shell">
                            <thead>
                            <tr>
                                <th>Profesor</th>
                                <th>Materia</th>
                                <th>Sección</th>
                                <th/>
                            </tr>
                            </thead>
                            <tbody>
                            {teacherAssignments.filter((item) => item.teacher).map((item) => <tr key={item.id}>
                                <td><strong>{item.teacher?.name}</strong><small className="block"
                                                                                style={{color: "var(--text-tertiary)"}}>{item.teacher?.email}</small>
                                </td>
                                <td>{item.subject.name}</td>
                                <td>{item.division}</td>
                                <td className="text-right">{canEdit &&
                                    <button type="button" className="icon-button h-9 w-9" title="Cambiar profesor"
                                            aria-label="Cambiar profesor" onClick={() => {
                                        setTeacherToChange(item);
                                        setReplacementTeacherId(item.teacher?.id?.toString() ?? "");
                                        searchTeachers();
                                    }}><i className="fa fa-arrow-right-arrow-left"/></button>}</td>
                            </tr>)}
                            {!teacherAssignments.some((item) => item.teacher) && <tr>
                                <td colSpan={4} className="py-10 text-center"
                                    style={{color: "var(--text-secondary)"}}>No hay profesores asignados todavía.
                                </td>
                            </tr>}
                            </tbody>
                        </table>
                    </div>}
            </div>
        </section>

        <RightModal title="Editar plantilla" isOpen={canEdit && showEdit} onClose={() => setShowEdit(false)}
                    className="h-full w-[420px] z-[9999]">
            <CourseTemplateForm initial={template} onDone={() => setShowEdit(false)} onSaved={load}/>
        </RightModal>

        <LeftModal title={formMode === "subject" ? "Agregar materia" : "Asignar profesor"} isOpen={showAssignment}
                   onClose={() => setShowAssignment(false)} className="h-full w-[min(560px,100vw)]">
            <form className="flex-1 space-y-5 overflow-y-auto pb-4" onSubmit={(event) => {
                event.preventDefault();
                void saveAssignment();
            }}>
                <p className="rounded-2xl border p-4 text-sm" style={{
                    borderColor: "var(--border-soft)",
                    background: "var(--surface-muted)",
                    color: "var(--text-secondary)"
                }}>
                    {formMode === "subject" ? "Selecciona una materia para agregarla al curso." : "Selecciona una materia del curso, la sección, el profesor y su horario."}
                </p>
                <div className={`grid gap-4 ${formMode === "teacher" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                    {formMode === "teacher" &&
                        <label><span className="mb-2 block text-sm font-bold">Sección</span><select
                            className="input select w-full" value={form.division} onChange={(e) => setForm({
                            ...form,
                            division: e.target.value,
                            subjectId: ""
                        })}>{divisions.map((division) => <option key={division}
                                                                 value={division}>Sección {division}</option>)}</select></label>}
                    <label><span className="mb-2 block text-sm font-bold">Materia *</span><SearchSelect
                        text="Buscar materia por nombre, código o descripción" hasError={false} portal
                        value={form.subjectId || undefined}
                        options={(formMode === "subject" ? subjects.map((subject) => ({
                            value: subject.id,
                            description: `${subject.name}${subject.code ? ` · ${subject.code}` : ""}`
                        })) : templateSubjects.filter((subject) => subject.name.toLowerCase().includes(templateSubjectTerm.toLowerCase())).map((subject) => ({
                            value: subject.id,
                            description: subject.name
                        })))}
                        onSearch={formMode === "subject" ? searchSubjects : setTemplateSubjectTerm}
                        onSelect={(value) => setForm((current) => ({...current, subjectId: value?.toString() ?? ""}))}
                        className="w-full"/></label>
                </div>
                {formMode === "teacher" && <><label className="block"><span className="mb-2 block text-sm font-bold">Profesor *</span><SearchSelect
                    text="Buscar por nombre, correo o usuario" hasError={false} portal
                    value={form.teacherId || undefined} options={teachers.map((teacher) => ({
                    value: teacher.id,
                    description: `${teacher.name} · ${teacher.email}`
                }))} onSearch={searchTeachers}
                    onSelect={(value) => setForm((current) => ({...current, teacherId: value?.toString() ?? ""}))}
                    className="w-full"/></label>
                    <div className="rounded-2xl border p-4"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                        <div className="flex items-center justify-between gap-3">
                            <div><strong className="text-sm">Horario semanal</strong><p className="text-xs"
                                                                                        style={{color: "var(--text-secondary)"}}>Bloques
                                de lunes a viernes.</p></div>
                            <button type="button" className="btn btn-sm" disabled={!form.teacherId} onClick={addSlot}><i
                                className="fa fa-clock me-1"/>Agregar bloque
                            </button>
                        </div>
                        <div className="mt-3 space-y-2">{form.schedule.map((slot, index) => <div key={index}
                                                                                                 className="grid grid-cols-[1fr_110px_110px_38px] items-center gap-2 rounded-xl border bg-white p-2"
                                                                                                 style={{borderColor: "var(--border-soft)"}}>
                            <select className="input select select-sm" value={slot.dayOfWeek}
                                    onChange={(e) => updateSlot(index, {dayOfWeek: e.target.value as WeekDay})}>{DAYS.map((day) =>
                                <option key={day.key} value={day.key}>{day.label}</option>)}</select>
                            <input type="time" className="input input-sm" value={time(slot.startsAt)}
                                   onChange={(e) => updateSlot(index, {startsAt: e.target.value})}/>
                            <input type="time" className="input input-sm" value={time(slot.endsAt)}
                                   onChange={(e) => updateSlot(index, {endsAt: e.target.value})}/>
                            <button type="button" className="icon-button h-9 w-9 text-[var(--danger)]"
                                    onClick={() => removeSlot(index)} title="Quitar"><i className="fa fa-trash"/>
                            </button>
                        </div>)}</div>
                    </div>
                </>}
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-sm" onClick={() => setShowAssignment(false)}>Cancelar
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !form.subjectId}><i
                        className={saving ? "fa fa-spinner fa-spin me-1" : "fa fa-check me-1"}/>{saving ? "Guardando..." : "Guardar asignación"}
                    </button>
                </div>
            </form>
        </LeftModal>

        <LeftModal title="Cambiar profesor" isOpen={Boolean(teacherToChange)}
                   onClose={() => !changingTeacher && setTeacherToChange(null)} className="h-full w-[420px]">
            <form className="flex flex-1 flex-col" onSubmit={(event) => {
                event.preventDefault();
                void changeTeacher();
            }}>
                <div className="rounded-2xl border p-4"
                     style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}><strong
                    className="block text-sm">{teacherToChange?.subject.name}</strong><span
                    className="mt-1 block text-xs"
                    style={{color: "var(--text-secondary)"}}>Sección {teacherToChange?.division} · El horario se conservará sin cambios.</span>
                </div>
                <label className="mt-5 block"><span
                    className="mb-2 block text-sm font-bold">Nuevo profesor *</span><SearchSelect
                    text="Buscar por nombre, correo o usuario" hasError={false} portal
                    value={replacementTeacherId || undefined} options={teachers.map((teacher) => ({
                    value: teacher.id,
                    description: `${teacher.name} · ${teacher.email}`
                }))} onSearch={searchTeachers} onSelect={(value) => setReplacementTeacherId(value?.toString() ?? "")}
                    className="w-full"/></label>
                <div className="mt-auto flex justify-end gap-2 pt-5">
                    <button type="button" className="btn btn-sm" disabled={changingTeacher}
                            onClick={() => setTeacherToChange(null)}>Cancelar
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary"
                            disabled={changingTeacher || !replacementTeacherId}><i
                        className={changingTeacher ? "fa fa-spinner fa-spin me-1" : "fa fa-user-check me-1"}/>{changingTeacher ? "Actualizando..." : "Guardar cambio"}
                    </button>
                </div>
            </form>
        </LeftModal>

        <CenterModal title="Remover materia"
                     description="Esta acción también eliminará sus asignaciones de profesores y horarios dentro de esta plantilla."
                     isOpen={Boolean(subjectToRemove)} onClose={() => !removingSubject && setSubjectToRemove(null)}
                     className="max-w-md">
            <div className="space-y-5">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    ¿Estás seguro de que deseas remover <strong
                    style={{color: "var(--text-primary)"}}>{subjectToRemove?.name}</strong> de este curso?
                </p>
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-sm" disabled={removingSubject}
                            onClick={() => setSubjectToRemove(null)}>Cancelar
                    </button>
                    <button type="button" className="btn btn-sm bg-[var(--danger)] text-white"
                            disabled={removingSubject || !subjectToRemove}
                            onClick={() => subjectToRemove && void removeSubject(subjectToRemove.id)}>
                        <i className={removingSubject ? "fa fa-spinner fa-spin me-1" : "fa fa-trash me-1"}/>{removingSubject ? "Removiendo..." : "Sí, remover"}
                    </button>
                </div>
            </div>
        </CenterModal>
    </div>;
};
