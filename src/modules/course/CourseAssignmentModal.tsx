import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {SearchSelect} from "../../components/io/input/SearchSelect.tsx";
import {CourseAcademicAssignment} from "../../domain/model/course/Course.ts";
import {CourseAcademicAssignmentRequest, CourseService} from "../../services/course/CourseService.ts";
import {Subject} from "../../domain/model/course/Subject.ts";
import {TeacherOption} from "../../services/course/CourseTemplateService.ts";

const service = CourseService.instance;
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as {message?: unknown}).message === "string"
        ? (error as {message: string}).message : fallback;

type AssignmentForm = {uid?: string; subjectId: string; teacherId: string; subject?: Subject; teacher?: TeacherOption};
const validAssignment = (assignment: AssignmentForm) => Boolean(assignment.subjectId && assignment.teacherId);

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
            toast.error("Selecciona la materia y el profesor.");
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

    return <article className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
        {canRemove && <div className="mb-4 flex items-center justify-between gap-3">
            <strong className="text-sm">Materia {index + 1}</strong>
            <button type="button" className="row-action row-action-danger" onClick={onRemove} title="Quitar materia">
                <i className="fa fa-trash"/>
            </button>
        </div>}
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
    </article>;
};

const toRequest = (assignment: AssignmentForm): CourseAcademicAssignmentRequest => ({
    subjectId: Number(assignment.subjectId),
    teacherId: Number(assignment.teacherId),
});

const fromAssignment = (assignment?: CourseAcademicAssignment | null): AssignmentForm => ({
    subjectId: assignment?.subject?.id?.toString() ?? "",
    teacherId: assignment?.teacher?.id?.toString() ?? "",
    subject: assignment?.subject,
    teacher: assignment?.teacher ?? undefined,
});
