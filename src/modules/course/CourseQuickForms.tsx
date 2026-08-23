import {useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {SearchSelect} from "../../components/io/input/SearchSelect.tsx";
import {Course, CourseAcademicAssignment, GradeType, GradeTypeLabel, ScheduleSlot, Specialization, WeekDay, WeekDayLabel} from "../../domain/model/course/Course.ts";
import {CourseAcademicAssignmentRequest, CourseService} from "../../services/course/CourseService.ts";
import {Subject} from "../../domain/model/course/Subject.ts";
import {TeacherOption} from "../../services/course/CourseTemplateService.ts";
import {SpecializationSelect} from "./template/SpecializationSelect.tsx";
import {formatTimeRange12, timeInputValue} from "../../utils/timeFormat.ts";

const service = CourseService.instance;
const DAYS: WeekDay[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const emptySlot = (): ScheduleSlot => ({dayOfWeek: "MONDAY", startsAt: "08:00", endsAt: "09:00"});
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as {message?: unknown}).message === "string"
        ? (error as {message: string}).message : fallback;

type AssignmentForm = {subjectId: string; teacherId: string; subject?: Subject; teacher?: TeacherOption; schedule: ScheduleSlot[]};
const emptyAssignment = (): AssignmentForm => ({subjectId: "", teacherId: "", schedule: [emptySlot()]});
const addMinutes = (value: string, minutes: number) => {
    const [hours = "0", mins = "0"] = timeInputValue(value).split(":");
    const total = Number(hours) * 60 + Number(mins) + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const validAssignment = (assignment: AssignmentForm) => Boolean(assignment.subjectId && assignment.teacherId
    && assignment.schedule.length && assignment.schedule.every((slot) => slot.dayOfWeek && slot.startsAt && slot.endsAt && slot.startsAt < slot.endsAt));

export const QuickCourseModal = ({open, onClose, onSaved}: {open: boolean; onClose: () => void; onSaved: (course: Course) => void}) => {
    const [name, setName] = useState("");
    const [division, setDivision] = useState("A");
    const [type, setType] = useState<GradeType>(GradeType.PRIMARY);
    const [specialization, setSpecialization] = useState<Specialization | null>(null);
    const [assignments, setAssignments] = useState<AssignmentForm[]>([emptyAssignment()]);
    const [saving, setSaving] = useState(false);
    const canSave = useMemo(() => Boolean(name.trim() && division.trim() && type)
        && assignments.every(validAssignment), [assignments, division, name, type]);

    const save = async () => {
        if (!canSave) {
            toast.error("Completa el curso, materia, profesor y horario antes de guardar.");
            return;
        }
        setSaving(true);
        try {
            const course = await service.createQuick({
                name: name.trim(),
                division: division.trim().toUpperCase(),
                type,
                specializationId: specialization?.id ?? null,
                assignments: assignments.map(toRequest),
            });
            toast.success("Curso creado correctamente.");
            onSaved(course);
            onClose();
            setName("");
            setDivision("A");
            setType(GradeType.PRIMARY);
            setSpecialization(null);
            setAssignments([emptyAssignment()]);
        } catch (error) {
            toast.error(message(error, "No se pudo crear el curso rápido."));
        } finally {
            setSaving(false);
        }
    };

    return <LeftModal title="Curso rápido" isOpen={open} onClose={onClose} className="h-full w-[min(720px,100vw)]">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
            event.preventDefault();
            void save();
        }}>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4 pr-1">
                <div className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                    <strong className="text-sm">Datos del curso</strong>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label><span className="mb-2 block text-sm font-bold">Nombre *</span>
                            <input className="input w-full" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. 4to Primaria"/>
                        </label>
                        <label><span className="mb-2 block text-sm font-bold">Sección *</span>
                            <input className="input w-full uppercase" value={division} onChange={(event) => setDivision(event.target.value)} placeholder="A"/>
                        </label>
                        <label><span className="mb-2 block text-sm font-bold">Tipo *</span>
                            <select className="input select w-full" value={type} onChange={(event) => setType(event.target.value as GradeType)}>
                                {Object.values(GradeType).map((value) => <option key={value} value={value}>{GradeTypeLabel[value]}</option>)}
                            </select>
                        </label>
                        <SpecializationSelect value={specialization} onChange={setSpecialization}/>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm">Materias, profesores y horarios</strong>
                        <button type="button" className="btn btn-sm" onClick={() => setAssignments((current) => [...current, emptyAssignment()])}>
                            <i className="fa fa-plus me-1"/>Agregar materia
                        </button>
                    </div>
                    {assignments.map((assignment, index) => <AssignmentEditor key={index}
                                                                              value={assignment}
                                                                              index={index}
                                                                              canRemove={assignments.length > 1}
                                                                              onChange={(next) => setAssignments((current) => current.map((item, position) => position === index ? next : item))}
                                                                              onRemove={() => setAssignments((current) => current.filter((_, position) => position !== index))}/>)}
                </div>
            </div>
            <div className="flex justify-end border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !canSave}>
                    <i className={saving ? "fa fa-spinner fa-spin me-1" : "fa fa-check me-1"}/>{saving ? "Guardando..." : "Guardar curso"}
                </button>
            </div>
        </form>
    </LeftModal>;
};

export const CourseAssignmentModal = ({courseId, assignment, open, onClose, onSaved}: {
    courseId?: string | number;
    assignment?: CourseAcademicAssignment | null;
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}) => {
    const [form, setForm] = useState<AssignmentForm>(() => fromAssignment(assignment));
    const [saving, setSaving] = useState(false);

    useEffect(() => setForm(fromAssignment(assignment)), [assignment, open]);

    const save = async () => {
        if (!courseId || !validAssignment(form)) {
            toast.error("Selecciona materia, profesor y horario.");
            return;
        }
        setSaving(true);
        try {
            if (assignment?.id) await service.updateAcademicAssignment(courseId, assignment.id, toRequest(form));
            else await service.saveAcademicAssignment(courseId, toRequest(form));
            toast.success(assignment?.id ? "Asignación actualizada." : "Asignación agregada.");
            onSaved();
            onClose();
        } catch (error) {
            toast.error(message(error, "No se pudo guardar la asignación."));
        } finally {
            setSaving(false);
        }
    };

    return <LeftModal title={assignment?.id ? "Editar materia y profesor" : "Agregar materia y profesor"} isOpen={open}
                      onClose={onClose} className="h-full w-[min(620px,100vw)]">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
            event.preventDefault();
            void save();
        }}>
            <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
                <AssignmentEditor value={form} index={0} canRemove={false} onChange={setForm}/>
            </div>
            <div className="flex justify-end border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !validAssignment(form)}>
                    <i className={saving ? "fa fa-spinner fa-spin me-1" : "fa fa-check me-1"}/>{saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </form>
    </LeftModal>;
};

const AssignmentEditor = ({value, index, canRemove, onChange, onRemove}: {
    value: AssignmentForm;
    index: number;
    canRemove: boolean;
    onChange: (next: AssignmentForm) => void;
    onRemove?: () => void;
}) => {
    const [subjects, setSubjects] = useState<Subject[]>(value.subject ? [value.subject] : []);
    const [teachers, setTeachers] = useState<TeacherOption[]>(value.teacher ? [value.teacher] : []);
    useEffect(() => {
        if (value.subject) setSubjects((current) => current.some((item) => item.id === value.subject?.id) ? current : [value.subject!, ...current]);
        if (value.teacher) setTeachers((current) => current.some((item) => item.id === value.teacher?.id) ? current : [value.teacher!, ...current]);
    }, [value.subject, value.teacher]);
    const updateSlot = (slotIndex: number, patch: Partial<ScheduleSlot>) =>
        onChange({...value, schedule: value.schedule.map((slot, position) => position === slotIndex ? {...slot, ...patch} : slot)});
    const addSlot = () => {
        const last = value.schedule[value.schedule.length - 1];
        const startsAt = last?.endsAt ? timeInputValue(last.endsAt) : "08:00";
        onChange({...value, schedule: [...value.schedule, {dayOfWeek: last?.dayOfWeek ?? "MONDAY", startsAt, endsAt: addMinutes(startsAt, 60)}]});
    };

    return <article className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
        <div className="mb-4 flex items-center justify-between gap-3">
            <strong className="text-sm">Materia {index + 1}</strong>
            {canRemove && <button type="button" className="icon-button h-9 w-9 text-[var(--danger)]" onClick={onRemove} title="Quitar materia">
                <i className="fa fa-trash"/>
            </button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-2 block text-sm font-bold">Materia *</span>
                <SearchSelect text="Buscar materia" hasError={false} portal value={value.subjectId || undefined}
                              options={subjects.map((subject) => ({value: subject.id, description: `${subject.name}${subject.code ? ` · ${subject.code}` : ""}`}))}
                              onSearch={(term) => service.subjectOptions(term).then(setSubjects)}
                              onSelect={(selected) => onChange({...value, subjectId: selected?.toString() ?? "", subject: undefined})}
                              className="w-full"/>
            </label>
            <label><span className="mb-2 block text-sm font-bold">Profesor *</span>
                <SearchSelect text="Buscar profesor" hasError={false} portal value={value.teacherId || undefined}
                              options={teachers.map((teacher) => ({value: teacher.id, description: `${teacher.name} · ${teacher.email}`}))}
                              onSearch={(term) => service.teacherOptions(term).then(setTeachers)}
                              onSelect={(selected) => onChange({...value, teacherId: selected?.toString() ?? "", teacher: undefined})}
                              className="w-full"/>
            </label>
        </div>
        <div className="mt-4 rounded-2xl border p-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
            <div className="flex items-center justify-between gap-3">
                <div><strong className="text-sm">Horario</strong>
                    <p className="mt-1 text-xs" style={{color: "var(--text-secondary)"}}>
                        {value.schedule.map((slot) => formatTimeRange12(slot.startsAt, slot.endsAt)).join(" · ")}
                    </p>
                </div>
                <button type="button" className="btn btn-sm" disabled={!value.teacherId} onClick={addSlot}>
                    <i className="fa fa-clock me-1"/>Agregar bloque
                </button>
            </div>
            <div className="mt-3 space-y-2">
                {value.schedule.map((slot, slotIndex) => <div key={slotIndex} className="grid grid-cols-[1fr_110px_110px_38px] items-center gap-2 rounded-xl border bg-white p-2" style={{borderColor: "var(--border-soft)"}}>
                    <select className="input select select-sm" value={slot.dayOfWeek} onChange={(event) => updateSlot(slotIndex, {dayOfWeek: event.target.value as WeekDay})}>
                        {DAYS.map((day) => <option key={day} value={day}>{WeekDayLabel[day]}</option>)}
                    </select>
                    <input type="time" className="input input-sm" value={timeInputValue(slot.startsAt)} onChange={(event) => updateSlot(slotIndex, {startsAt: event.target.value})}/>
                    <input type="time" className="input input-sm" value={timeInputValue(slot.endsAt)} onChange={(event) => updateSlot(slotIndex, {endsAt: event.target.value})}/>
                    <button type="button" className="icon-button h-9 w-9 text-[var(--danger)]" disabled={value.schedule.length === 1}
                            onClick={() => onChange({...value, schedule: value.schedule.filter((_, position) => position !== slotIndex)})}>
                        <i className="fa fa-trash"/>
                    </button>
                </div>)}
            </div>
        </div>
    </article>;
};

const toRequest = (assignment: AssignmentForm): CourseAcademicAssignmentRequest => ({
    subjectId: Number(assignment.subjectId),
    teacherId: Number(assignment.teacherId),
    schedule: assignment.schedule,
});

const fromAssignment = (assignment?: CourseAcademicAssignment | null): AssignmentForm => ({
    subjectId: assignment?.subject?.id?.toString() ?? "",
    teacherId: assignment?.teacher?.id?.toString() ?? "",
    subject: assignment?.subject,
    teacher: assignment?.teacher ?? undefined,
    schedule: assignment?.schedule?.length ? assignment.schedule.map((slot) => ({...slot})) : [emptySlot()],
});
