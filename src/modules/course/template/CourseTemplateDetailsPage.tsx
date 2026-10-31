import {ReactNode, useMemo, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useParams, useSearchParams} from "react-router-dom";
import {toast} from "react-toastify";

import {queryKeys} from "../../../app/query/queryKeys.ts";
import {GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {CourseTemplateService, TeacherOption, TemplateSubject} from "../../../services/course/CourseTemplateService.ts";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DetailHeader, initialsOf} from "../../../components/ui/detail/DetailHeader.tsx";
import {Badge} from "../../../components/ui/detail/StatusBadge.tsx";
import {MetricCard} from "../../../components/ui/metrics/MetricCard.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {CourseTemplateForm} from "./CourseTemplateForm.tsx";
import {TemplateSubjectForm} from "./TemplateSubjectForm.tsx";
import {
    DAYS,
    DayLabel,
    describeSlots,
    divisionsOf,
    formatHours,
    hhmm,
    slotMinutes,
    sortSlots,
    TemplateSlot,
} from "./schedule.ts";

const service = CourseTemplateService.instance;
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message : fallback;

type Tab = "global" | "subjects" | "teachers";
type ClassItem = {subject: TemplateSubject; division: string; teacher?: TeacherOption | null; slot: TemplateSlot};
type TeacherLoad = {teacher: TeacherOption; minutes: number; classes: {subject: TemplateSubject; division: string; slots: TemplateSlot[]}[]};

/** Una materia está lista cuando cada sección tiene profesor y al menos una clase. */
const isPlanned = (subject: TemplateSubject, divisions: string[]) => divisions.every((division) => {
    const section = subject.sections.find((item) => item.division === division);
    return Boolean(section?.teacher && section.slots.length);
});

const sectionMinutes = (subjects: TemplateSubject[], division: string) => subjects
    .flatMap((subject) => subject.sections.filter((section) => section.division === division))
    .flatMap((section) => section.slots).reduce((total, slot) => total + slotMinutes(slot), 0);

/**
 * Plantilla de curso: secciones, materias y, por sección, el profesor y el horario de cada materia.
 * Global muestra el horario semanal; Materias y Profesores, el plan visto desde cada lado.
 */
export const CourseTemplateDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const canView = hasAuthority(AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW);
    const canEdit = hasAuthority(AuthorityKey.COURSE_TEMPLATE_EDIT);
    const canGenerate = hasAuthority(AuthorityKey.COURSE_GENERATE);

    const tab = (["global", "subjects", "teachers"].includes(searchParams.get("tab") ?? "") ? searchParams.get("tab") : "global") as Tab;
    const setTab = (next: Tab) => setSearchParams(next === "global" ? {} : {tab: next}, {replace: true});

    const [showEdit, setShowEdit] = useState(false);
    const [editing, setEditing] = useState<{subject: TemplateSubject | null; division?: string} | null>(null);
    const [generating, setGenerating] = useState(false);
    const [subjectToRemove, setSubjectToRemove] = useState<TemplateSubject | null>(null);
    const [removing, setRemoving] = useState(false);
    const [division, setDivision] = useState<string | null>(null);

    const templateKey = [...queryKeys.courseTemplates.all, "detail", id];
    const subjectsKey = [...queryKeys.courseTemplates.all, "subjects", id];
    const templateQuery = useQuery({
        queryKey: templateKey,
        queryFn: ({signal}) => service.withSignal(signal).getOne(id),
        enabled: Boolean(id),
        meta: {errorMessage: "No se pudo cargar la plantilla."},
    });
    const subjectsQuery = useQuery({
        queryKey: subjectsKey,
        queryFn: ({signal}) => service.withSignal(signal).templateSubjects(id as string),
        enabled: Boolean(id) && canView,
        meta: {errorMessage: "No se pudieron cargar las materias."},
    });
    const template = templateQuery.data;
    const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
    const divisions = useMemo(() => divisionsOf(template?.count), [template?.count]);
    const selectedDivision = division && divisions.includes(division) ? division : divisions[0];

    const teachers = useMemo<TeacherLoad[]>(() => {
        const loads = new Map<number, TeacherLoad>();
        subjects.forEach((subject) => subject.sections.forEach((section) => {
            if (!section.teacher) return;
            const load = loads.get(section.teacher.id) ?? {teacher: section.teacher, minutes: 0, classes: []};
            load.minutes += section.slots.reduce((total, slot) => total + slotMinutes(slot), 0);
            load.classes.push({subject, division: section.division, slots: section.slots});
            loads.set(section.teacher.id, load);
        }));
        return [...loads.values()].sort((a, b) => (a.teacher.name ?? "").localeCompare(b.teacher.name ?? ""));
    }, [subjects]);
    const pending = subjects.filter((subject) => !isPlanned(subject, divisions)).length;

    const removeSubject = async () => {
        if (!subjectToRemove) return;
        setRemoving(true);
        try {
            await service.deleteTemplateSubject(subjectToRemove.id);
            await queryClient.invalidateQueries({queryKey: subjectsKey});
            setSubjectToRemove(null);
            toast.success("Materia removida de la plantilla.");
        } catch (error) {
            toast.error(message(error, "No se pudo remover la materia."));
        } finally {
            setRemoving(false);
        }
    };

    const generateCourses = async () => {
        if (!id) return;
        setGenerating(true);
        try {
            await service.generateCourses(id);
            void queryClient.invalidateQueries({queryKey: queryKeys.courses.all});
            toast.success("Cursos del período actualizados con las materias y profesores de la plantilla.");
        } catch (error) {
            toast.error(message(error, "No se pudieron generar los cursos."));
        } finally {
            setGenerating(false);
        }
    };

    if (templateQuery.isLoading) return <LoadingContent loading className="py-16"/>;
    if (!template || !id) return <EmptyState title="No se encontró la plantilla"
                                             description="Vuelve al listado e intenta nuevamente." icon="fa-layer-group"/>;

    const title = template.name ?? template.specialization?.name ?? "Plantilla";
    const addButton = canEdit && (
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setEditing({subject: null})}>
            <i className="fa fa-plus"/>Agregar materia
        </button>
    );

    return <div className="space-y-4">
        <DetailHeader
            avatar={title}
            title={title}
            subtitle={[template.type ? GradeTypeLabel[template.type] : null, template.specialization?.name].filter(Boolean).join(" · ") || "Sin área especializada"}
            badges={<>
                <Badge>{divisions.length} {divisions.length === 1 ? "sección" : "secciones"}</Badge>
                <Badge>{subjects.length} {subjects.length === 1 ? "materia" : "materias"}</Badge>
                <Badge>{teachers.length} {teachers.length === 1 ? "profesor" : "profesores"}</Badge>
            </>}
            actions={<>
                {canEdit && <button type="button" className="btn btn-sm" onClick={() => setShowEdit(true)}>
                    <i className="fa fa-pen"/>Editar
                </button>}
                {canGenerate && <button type="button" className="btn btn-sm btn-primary" disabled={generating}
                                        onClick={() => void generateCourses()}>
                    <i className={generating ? "fa fa-spinner fa-spin" : "fa fa-layer-group"}/>
                    {generating ? "Generando..." : "Generar cursos del período"}
                </button>}
            </>}
        />

        <section className="detail-section">
            <div className="flex flex-col gap-3 border-b px-4 pt-3 sm:flex-row sm:items-end sm:justify-between sm:px-5"
                 style={{borderColor: "var(--border-soft)"}}>
                <div role="tablist" aria-label="Secciones de la plantilla" className="-mb-px flex gap-1 overflow-x-auto">
                    <TabButton active={tab === "global"} onClick={() => setTab("global")} icon="fa-table-cells-large">Global</TabButton>
                    <TabButton active={tab === "subjects"} onClick={() => setTab("subjects")} icon="fa-book-open" count={subjects.length}>Materias</TabButton>
                    <TabButton active={tab === "teachers"} onClick={() => setTab("teachers")} icon="fa-chalkboard-user" count={teachers.length}>Profesores</TabButton>
                </div>
                <div className="pb-3">{addButton}</div>
            </div>

            <div className="p-4 sm:p-5">
                {subjectsQuery.isLoading ? <LoadingContent loading className="py-12"/> : subjects.length === 0 ? (
                    <EmptyState title="Sin materias" icon="fa-book-open"
                                description="Agrega las materias y, para cada sección, su profesor, días y horario."/>
                ) : tab === "global" ? (
                    <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard title="Materias" value={String(subjects.length)} icon="fa-book-open"
                                        delta={pending ? `${pending} por planificar` : "Todas planificadas"} tone={pending ? "warning" : "success"}/>
                            <MetricCard title="Profesores" value={String(teachers.length)} icon="fa-chalkboard-user"/>
                            <MetricCard title="Secciones" value={String(divisions.length)} icon="fa-users-rectangle" delta={divisions.join(" · ")}/>
                            <MetricCard title={`Horas semanales · ${selectedDivision ?? "—"}`} icon="fa-clock" tone="success"
                                        value={formatHours(selectedDivision ? sectionMinutes(subjects, selectedDivision) : 0)}/>
                        </div>
                        <WeekSchedule subjects={subjects} divisions={divisions} division={selectedDivision} onDivision={setDivision}/>
                    </div>
                ) : tab === "subjects" ? (
                    <ul className="space-y-3">
                        {subjects.map((subject) => (
                            <SubjectRow key={subject.id} subject={subject} divisions={divisions} canEdit={canEdit}
                                        onEdit={(division) => setEditing({subject, division})} onRemove={() => setSubjectToRemove(subject)}/>
                        ))}
                    </ul>
                ) : teachers.length === 0 ? (
                    <EmptyState title="Sin profesores" icon="fa-chalkboard-user"
                                description="Asigna un profesor a cada sección desde la pestaña Materias."/>
                ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                        {teachers.map((load) => <TeacherCard key={load.teacher.id} load={load}/>)}
                    </div>
                )}
            </div>
        </section>

        <RightModal title="Editar plantilla" isOpen={canEdit && showEdit} onClose={() => setShowEdit(false)}
                    className="h-full w-[420px] z-[9999]">
            <CourseTemplateForm initial={template} onDone={() => setShowEdit(false)}
                                onSaved={() => void queryClient.invalidateQueries({queryKey: templateKey})}/>
        </RightModal>

        <LeftModal title={editing?.subject ? editing.subject.name : "Agregar materia"} isOpen={canEdit && editing !== null}
                   onClose={() => setEditing(null)} className="h-full w-[min(480px,100vw)]">
            {editing !== null && (
                <TemplateSubjectForm key={`${editing.subject?.id ?? "new"}-${editing.division ?? ""}`} templateId={id} divisions={divisions}
                                     initial={editing.subject} initialDivision={editing.division}
                                     onSaved={(saved, division) => {
                                         void queryClient.invalidateQueries({queryKey: subjectsKey});
                                         toast.success(`${saved.name}: sección ${division} guardada.`);
                                         setEditing(null);
                                     }}/>
            )}
        </LeftModal>

        <CenterModal title="Remover materia" isOpen={Boolean(subjectToRemove)}
                     onClose={() => !removing && setSubjectToRemove(null)} className="max-w-md">
            <div className="space-y-5">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    ¿Quitar <strong style={{color: "var(--text-primary)"}}>{subjectToRemove?.name}</strong> de esta
                    plantilla, con sus profesores y horarios? Los cursos dejarán de tenerla cuando se vuelvan a generar.
                </p>
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-sm" disabled={removing} onClick={() => setSubjectToRemove(null)}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-sm bg-[var(--danger)] text-white" disabled={removing}
                            onClick={() => void removeSubject()}>
                        <i className={removing ? "fa fa-spinner fa-spin" : "fa fa-trash"}/>{removing ? "Removiendo..." : "Sí, remover"}
                    </button>
                </div>
            </div>
        </CenterModal>
    </div>;
};

const TabButton = ({active, onClick, icon, count, children}: {
    active: boolean; onClick: () => void; icon: string; count?: number; children: ReactNode;
}) => (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}
            className="inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors"
            style={{borderColor: active ? "var(--accent)" : "transparent", color: active ? "var(--accent)" : "var(--text-secondary)"}}>
        <i className={`fa ${icon} text-xs`}/>{children}
        {count !== undefined && (
            <span className="rounded-full px-1.5 text-[11px]"
                  style={{background: active ? "var(--accent-soft)" : "var(--surface-muted)"}}>{count}</span>
        )}
    </button>
);

const Avatar = ({name}: {name?: string}) => (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
          style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{initialsOf(name)}</span>
);

/** Horario de la semana de una sección: una columna por día con sus clases en orden. */
const WeekSchedule = ({subjects, divisions, division, onDivision}: {
    subjects: TemplateSubject[]; divisions: string[]; division?: string; onDivision: (division: string) => void;
}) => {
    const classes: ClassItem[] = subjects.flatMap((subject) => subject.sections
        .filter((section) => section.division === division)
        .flatMap((section) => section.slots.map((slot) => ({subject, division: section.division, teacher: section.teacher, slot}))));
    const days = DAYS.filter((day, index) => index < 5 || classes.some((item) => item.slot.dayOfWeek === day));

    return (
        <div className="rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                <h3 className="text-sm font-bold" style={{color: "var(--text-primary)"}}>Horario semanal</h3>
                <div className="flex gap-1" role="group" aria-label="Sección">
                    {divisions.map((item) => (
                        <button key={item} type="button" aria-pressed={item === division} onClick={() => onDivision(item)}
                                className="h-8 min-w-[2.25rem] rounded-lg border px-2 text-xs font-bold"
                                style={item === division
                                    ? {background: "var(--accent)", borderColor: "var(--accent)", color: "white"}
                                    : {borderColor: "var(--border-soft)", color: "var(--text-secondary)"}}>
                            {item}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="grid min-w-[720px] gap-px" style={{gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, background: "var(--border-soft)"}}>
                    {days.map((day) => {
                        const dayClasses = sortSlots(classes.map((item) => ({...item.slot, item})))
                            .filter((slot) => slot.dayOfWeek === day).map((slot) => slot.item);
                        return (
                            <div key={day} className="min-h-[160px] p-2" style={{background: "var(--surface)"}}>
                                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.06em]" style={{color: "var(--text-tertiary)"}}>{DayLabel[day]}</p>
                                <div className="space-y-1.5">
                                    {dayClasses.length === 0 ? (
                                        <p className="px-1 text-xs" style={{color: "var(--text-tertiary)"}}>Libre</p>
                                    ) : dayClasses.map((item, index) => (
                                        <div key={`${item.subject.id}-${index}`} className="rounded-xl border-l-4 px-2.5 py-2"
                                             style={{borderColor: "var(--accent)", background: "var(--accent-soft)"}}>
                                            <p className="text-[11px] font-semibold" style={{color: "var(--accent)"}}>
                                                {hhmm(item.slot.startsAt)}–{hhmm(item.slot.endsAt)}
                                            </p>
                                            <p className="truncate text-sm font-bold" style={{color: "var(--text-primary)"}}>{item.subject.name}</p>
                                            <p className="truncate text-xs" style={{color: "var(--text-secondary)"}}>{item.teacher?.name ?? "Sin profesor"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/** Materia con su plan por sección: profesor y días y horas de clase. */
const SubjectRow = ({subject, divisions, canEdit, onEdit, onRemove}: {
    subject: TemplateSubject; divisions: string[]; canEdit: boolean; onEdit: (division?: string) => void; onRemove: () => void;
}) => {
    const planned = isPlanned(subject, divisions);
    return (
        <li className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)"}}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold" style={{color: "var(--text-primary)"}}>
                        {subject.name}
                        {subject.code && <span className="text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>{subject.code}</span>}
                        {!planned && <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                           style={{background: "var(--warning-soft, #fef3c7)", color: "var(--warning, #b45309)"}}>Por planificar</span>}
                    </p>
                    {subject.description && <p className="mt-0.5 line-clamp-1 text-sm" style={{color: "var(--text-secondary)"}}>{subject.description}</p>}
                </div>
                {canEdit && (
                    <div className="flex shrink-0 gap-1">
                        <button type="button" className="row-action row-action-danger" title="Remover materia" aria-label={`Remover ${subject.name}`} onClick={onRemove}>
                            <i className="fa fa-trash"/>
                        </button>
                    </div>
                )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {divisions.map((division) => {
                    const section = subject.sections.find((item) => item.division === division);
                    return (
                        <div key={division} className="flex items-start gap-3 rounded-xl p-3" style={{background: "var(--surface-muted)"}}>
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                                  style={{background: "var(--surface)", color: "var(--accent)"}}>{division}</span>
                            <div className="min-w-0 text-sm">
                                <p className="truncate font-semibold" style={{color: section?.teacher ? "var(--text-primary)" : "var(--danger)"}}>
                                    {section?.teacher?.name ?? "Sin profesor"}
                                </p>
                                {section?.slots.length
                                    ? describeSlots(section.slots).map((line) => <p key={line} className="text-xs" style={{color: "var(--text-secondary)"}}>{line}</p>)
                                    : <p className="text-xs" style={{color: "var(--danger)"}}>Sin horario</p>}
                            </div>
                            {canEdit && (
                                <button type="button" className="row-action ms-auto shrink-0" title={`Editar sección ${division}`}
                                        aria-label={`Editar ${subject.name}, sección ${division}`} onClick={() => onEdit(division)}>
                                    <i className="fa fa-pen"/>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </li>
    );
};

/** Profesor con sus clases en la plantilla y las horas que suma por semana. */
const TeacherCard = ({load}: {load: TeacherLoad}) => (
    <article className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)"}}>
        <div className="flex items-center gap-3">
            <Avatar name={load.teacher.name}/>
            <div className="min-w-0 flex-1">
                <p className="truncate font-bold" style={{color: "var(--text-primary)"}}>{load.teacher.name}</p>
                <p className="truncate text-xs" style={{color: "var(--text-tertiary)"}}>{load.teacher.email}</p>
            </div>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                {formatHours(load.minutes)} / semana
            </span>
        </div>
        <ul className="mt-3 divide-y text-sm" style={{borderColor: "var(--border-soft)"}}>
            {load.classes.map((item) => (
                <li key={`${item.subject.id}-${item.division}`} className="flex items-start justify-between gap-3 py-2" style={{borderColor: "var(--border-soft)"}}>
                    <span className="min-w-0">
                        <span className="block truncate font-semibold" style={{color: "var(--text-primary)"}}>{item.subject.name}</span>
                        <span className="block text-xs" style={{color: "var(--text-tertiary)"}}>Sección {item.division}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs" style={{color: "var(--text-secondary)"}}>
                        {describeSlots(item.slots).map((line) => <span key={line} className="block">{line}</span>)}
                    </span>
                </li>
            ))}
        </ul>
    </article>
);
