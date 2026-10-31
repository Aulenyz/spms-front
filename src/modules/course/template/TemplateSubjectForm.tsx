import {FormEvent, useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {Subject} from "../../../domain/model/course/Subject.ts";
import {
    CourseTemplateService,
    TeacherOption,
    TemplateSection,
    TemplateSubject,
    TemplateSubjectRequest,
} from "../../../services/course/CourseTemplateService.ts";
import {DAYS, DayOfWeek, DayShort, hhmm, sortSlots} from "./schedule.ts";

const service = CourseTemplateService.instance;

type Row = {days: DayOfWeek[]; startsAt: string; endsAt: string};
type SectionPlan = {teacher: TeacherOption | null; rows: Row[]};

const emptyRow = (): Row => ({days: [], startsAt: "08:00", endsAt: "09:00"});

/** Los días con la misma hora se editan juntos: Lun y Mié de 08:00 a 09:00 es una sola fila. */
const rowsOf = (slots: TemplateSection["slots"]): Row[] => {
    const rows = new Map<string, Row>();
    sortSlots(slots).forEach((slot) => {
        const key = `${hhmm(slot.startsAt)}-${hhmm(slot.endsAt)}`;
        const row = rows.get(key) ?? {days: [], startsAt: hhmm(slot.startsAt), endsAt: hhmm(slot.endsAt)};
        row.days.push(slot.dayOfWeek);
        rows.set(key, row);
    });
    return rows.size ? [...rows.values()] : [emptyRow()];
};

const planOf = (section?: TemplateSection): SectionPlan =>
    ({teacher: section?.teacher ?? null, rows: section ? rowsOf(section.slots) : [emptyRow()]});

const isPlanned = (section?: TemplateSection) => Boolean(section?.teacher && section.slots.length);

const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as {message?: unknown}).message === "string"
        ? (error as {message: string}).message : fallback;

/**
 * Agrega una materia a la plantilla o planifica una de sus secciones: se elige la sección y, para
 * ella, el profesor y los días y horas de clase. Las demás secciones conservan lo que tenían.
 */
export const TemplateSubjectForm = ({templateId, divisions, initial, initialDivision, onSaved}: {
    templateId: string;
    divisions: string[];
    initial: TemplateSubject | null;
    initialDivision?: string;
    onSaved: (saved: TemplateSubject, division: string) => void;
}) => {
    const sectionOf = (division?: string) => initial?.sections.find((item) => item.division === division);
    const firstDivision = initialDivision ?? divisions.find((division) => !isPlanned(sectionOf(division))) ?? divisions[0];

    const [subjectId, setSubjectId] = useState<number | null>(initial?.subjectId ?? null);
    const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
    const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);
    const [division, setDivision] = useState<string | undefined>(firstDivision);
    const [plan, setPlan] = useState<SectionPlan>(() => planOf(sectionOf(firstDivision)));
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const searchSubjects = (term = "") => service.subjectOptions(templateId, term)
        .then(setSubjectOptions, () => toast.error("No se pudieron buscar las materias."));
    const searchTeachers = (term = "") => service.teacherOptions(templateId, term)
        .then(setTeacherOptions, () => toast.error("No se pudieron buscar los profesores."));

    useEffect(() => {
        if (!initial) void searchSubjects();
        void searchTeachers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // El profesor elegido sigue en la lista aunque la búsqueda actual no lo traiga.
    const teachers = useMemo(() => plan.teacher && !teacherOptions.some((option) => option.id === plan.teacher!.id)
        ? [...teacherOptions, plan.teacher] : teacherOptions, [teacherOptions, plan.teacher]);

    const changeDivision = (next?: string) => {
        setDivision(next);
        setPlan(planOf(sectionOf(next)));
        setSubmitted(false);
    };
    const updateRow = (index: number, change: Partial<Row>) =>
        setPlan((current) => ({...current, rows: current.rows.map((row, i) => i === index ? {...row, ...change} : row)}));
    const toggleDay = (index: number, day: DayOfWeek) => setPlan((current) => ({
        ...current,
        rows: current.rows.map((row, i) => i !== index ? row
            : {...row, days: row.days.includes(day) ? row.days.filter((item) => item !== day) : [...row.days, day]}),
    }));

    const problems = [
        !division && "Elige la sección.",
        !plan.teacher && "Elige el profesor.",
        plan.rows.some((row) => row.days.length === 0) && "Marca al menos un día en cada horario.",
        plan.rows.some((row) => !row.startsAt || !row.endsAt || row.startsAt >= row.endsAt) && "La hora de inicio debe ser antes de la de fin.",
    ].filter(Boolean) as string[];

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitted(true);
        if (!subjectId || !division || problems.length) return;
        const request: TemplateSubjectRequest = {
            subjectId,
            sections: [{
                division,
                teacherId: plan.teacher!.id,
                slots: plan.rows.flatMap((row) => row.days.map((dayOfWeek) => ({dayOfWeek, startsAt: row.startsAt, endsAt: row.endsAt}))),
            }],
        };
        setSaving(true);
        try {
            onSaved(await service.saveTemplateSubject(templateId, request), division);
        } catch (error) {
            toast.error(message(error, "No se pudo guardar la materia."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void submit(event)}>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
                <label className="block">
                    <span className="form-label">Materia *</span>
                    {initial ? (
                        <span className="input input-sm flex w-full items-center font-semibold" style={{color: "var(--text-primary)"}}>
                            {initial.name}{initial.code ? ` · ${initial.code}` : ""}
                        </span>
                    ) : (
                        <SearchSelect text="Buscar por nombre o código" hasError={submitted && !subjectId} portal
                                      value={subjectId ?? undefined}
                                      options={subjectOptions.map((subject) => ({
                                          value: subject.id,
                                          description: `${subject.name}${subject.code ? ` · ${subject.code}` : ""}`,
                                      }))}
                                      onSearch={(term) => void searchSubjects(term)}
                                      onSelect={(value) => setSubjectId(value ? Number(value) : null)}
                                      className="w-full"/>
                    )}
                </label>

                {divisions.length === 0 ? (
                    <p className="text-sm" style={{color: "var(--danger)"}}>La plantilla no tiene secciones. Edítala y define cuántas tiene.</p>
                ) : <>
                    <div>
                        <span className="form-label">Sección *</span>
                        <DropdownSelect text="Elige la sección" hasError={submitted && !division} portal className="w-full"
                                        value={division}
                                        options={divisions.map((item) => ({
                                            value: item,
                                            description: `Sección ${item}${isPlanned(sectionOf(item)) ? " · planificada" : ""}`,
                                        }))}
                                        onSelect={(value) => changeDivision(value ? String(value) : undefined)}/>
                    </div>

                    <div>
                        <span className="form-label">Profesor *</span>
                        <SearchSelect text="Buscar profesor" hasError={submitted && !plan.teacher} portal
                                      value={plan.teacher?.id}
                                      options={teachers.map((teacher) => ({value: teacher.id, description: teacher.name || teacher.email}))}
                                      onSearch={(term) => void searchTeachers(term)}
                                      onSelect={(value) => setPlan((current) => ({
                                          ...current, teacher: teachers.find((teacher) => teacher.id === Number(value)) ?? null,
                                      }))}
                                      className="w-full"/>
                    </div>

                    <div>
                        <span className="form-label">Días y horario *</span>
                        <div className="space-y-2">
                            {plan.rows.map((row, index) => (
                                <div key={index} className="rounded-xl border p-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                    <div className="flex flex-wrap gap-1">
                                        {DAYS.map((day) => {
                                            const on = row.days.includes(day);
                                            return (
                                                <button key={day} type="button" aria-pressed={on} onClick={() => toggleDay(index, day)}
                                                        className="h-8 min-w-[2.6rem] rounded-lg border px-2 text-xs font-semibold transition-colors"
                                                        style={on
                                                            ? {background: "var(--accent)", borderColor: "var(--accent)", color: "white"}
                                                            : {borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                                    {DayShort[day]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="input input-sm min-w-0 flex-1">
                                            <input type="time" aria-label="Desde" value={row.startsAt} step={300}
                                                   onChange={(event) => updateRow(index, {startsAt: event.target.value})}/>
                                        </span>
                                        <span className="text-xs" style={{color: "var(--text-tertiary)"}}>a</span>
                                        <span className="input input-sm min-w-0 flex-1">
                                            <input type="time" aria-label="Hasta" value={row.endsAt} step={300}
                                                   onChange={(event) => updateRow(index, {endsAt: event.target.value})}/>
                                        </span>
                                        <button type="button" className="row-action row-action-danger" title="Quitar horario"
                                                aria-label="Quitar horario" disabled={plan.rows.length === 1}
                                                onClick={() => setPlan((current) => ({...current, rows: current.rows.filter((_, i) => i !== index)}))}>
                                            <i className="fa fa-trash"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="mt-2 text-xs font-semibold hover:underline" style={{color: "var(--accent)"}}
                                onClick={() => setPlan((current) => ({...current, rows: [...current.rows, emptyRow()]}))}>
                            <i className="fa fa-plus me-1"/>Otro horario
                        </button>
                    </div>

                    {submitted && problems.map((problem) => (
                        <p key={problem} className="text-xs" style={{color: "var(--danger)"}}>{problem}</p>
                    ))}
                </>}
            </div>
            <div className="flex justify-end border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving || divisions.length === 0}>
                    <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{saving ? "Guardando..." : "Guardar sección"}
                </button>
            </div>
        </form>
    );
};
