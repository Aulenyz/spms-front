import {useEffect, useMemo, useState} from "react";
import clsx from "clsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";

import {queryKeys} from "../../../app/query/queryKeys.ts";
import {GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {CourseTemplateService, TemplateSubject} from "../../../services/course/CourseTemplateService.ts";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {StatusBadge} from "../../../components/ui/detail/StatusBadge.tsx";
import {OptionsMenu} from "../../../components/ui/OptionsMenu.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {TemplateEvaluationPeriods} from "./TemplateEvaluationPeriods.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {CourseTemplateForm} from "./CourseTemplateForm.tsx";
import {TemplateSubjectForm} from "./TemplateSubjectForm.tsx";
import {describeSlots, divisionsOf} from "./schedule.ts";

const service = CourseTemplateService.instance;

type TabKey = "subjects" | "evaluations";
const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
    {key: "subjects", label: "Materias y profesores", icon: "fa-book-open"},
    {key: "evaluations", label: "Períodos de evaluación", icon: "fa-clipboard-check"},
];
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message : fallback;

/** Una materia está lista cuando cada sección tiene profesor y al menos una clase. */
const isPlanned = (subject: TemplateSubject, divisions: string[]) => divisions.every((division) => {
    const section = subject.sections.find((item) => item.division === division);
    return Boolean(section?.teacher && section.slots.length);
});

/**
 * Plantilla de curso: sus materias y, por sección, el profesor y el horario de cada una.
 */
export const CourseTemplateDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const canView = hasAuthority(AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW);
    const canEdit = hasAuthority(AuthorityKey.COURSE_TEMPLATE_EDIT);
    const canGenerate = hasAuthority(AuthorityKey.COURSE_GENERATE);
    const canChangeStatus = hasAuthority(AuthorityKey.COURSE_TEMPLATE_STATUS_UPDATE);

    const [showEdit, setShowEdit] = useState(false);
    const [editing, setEditing] = useState<{subject: TemplateSubject | null; division?: string} | null>(null);
    const [subjectToRemove, setSubjectToRemove] = useState<TemplateSubject | null>(null);
    const [removing, setRemoving] = useState(false);
    const [confirmInactivate, setConfirmInactivate] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [tab, setTab] = useState<TabKey>(() => {
        const saved = id ? localStorage.getItem(`course-template-tab-${id}`) : null;
        return TABS.some((item) => item.key === saved) ? saved as TabKey : "subjects";
    });

    useEffect(() => {
        if (id) localStorage.setItem(`course-template-tab-${id}`, tab);
    }, [id, tab]);

    const templateKey = [...queryKeys.courseTemplates.all, "detail", id];
    const subjectsKey = [...queryKeys.courseTemplates.all, "subjects", id];
    const templateQuery = useQuery({
        queryKey: templateKey,
        queryFn: ({signal}) => service.withSignal(signal).getOne(id),
        enabled: Boolean(id),
        meta: {errorMessage: "No se pudo cargar el curso base."},
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

    const removeSubject = async () => {
        if (!subjectToRemove) return;
        setRemoving(true);
        try {
            await service.deleteTemplateSubject(subjectToRemove.id);
            await queryClient.invalidateQueries({queryKey: subjectsKey});
            setSubjectToRemove(null);
            toast.success("Materia removida del curso base.");
        } catch (error) {
            toast.error(message(error, "No se pudo remover la materia."));
        } finally {
            setRemoving(false);
        }
    };

    const generateCourses = async () => {
        if (!id) return;
        try {
            await service.generateCourses(id);
            void queryClient.invalidateQueries({queryKey: queryKeys.courses.all});
            toast.success("Cursos del período actualizados con las materias y profesores del curso base.");
        } catch (error) {
            toast.error(message(error, "No se pudieron generar los cursos."));
        }
    };

    const toggleStatus = async () => {
        if (!id) return;
        setTogglingStatus(true);
        try {
            const saved = await service.updateStatus(id);
            queryClient.setQueryData(templateKey, saved);
            void queryClient.invalidateQueries({queryKey: queryKeys.courseTemplates.all});
            setConfirmInactivate(false);
            toast.success(saved.active ? "Curso base activado." : "Curso base inactivado: ya no genera cursos.");
        } catch (error) {
            toast.error(message(error, "No se pudo cambiar el estado del curso base."));
        } finally {
            setTogglingStatus(false);
        }
    };

    if (templateQuery.isLoading) return <LoadingContent loading className="py-16"/>;
    if (!template || !id) return <EmptyState title="No se encontró el curso base"
                                             description="Vuelve al listado e intenta nuevamente." icon="fa-layer-group"/>;

    const title = template.name ?? template.specialization?.name ?? "Curso base";
    const active = template.active !== false;

    return <div className="space-y-4">
        <DetailHeader
            avatar={title}
            title={title}
            subtitle={[template.type ? GradeTypeLabel[template.type] : null, template.specialization?.name].filter(Boolean).join(" · ") || "Sin área especializada"}
            badges={<StatusBadge active={active}/>}
            actions={<OptionsMenu label={`Opciones de ${title}`} items={[
                {label: "Editar curso base", icon: "fa-pen", visible: canEdit, onSelect: () => setShowEdit(true)},
                {label: "Generar cursos del período", icon: "fa-layer-group", visible: canGenerate && active, onSelect: generateCourses},
                {
                    label: active ? "Marcar como inactivo" : "Marcar como activo", icon: "fa-toggle-on", visible: canChangeStatus,
                    onSelect: () => active ? setConfirmInactivate(true) : toggleStatus(),
                },
            ]}/>}
        />

        <nav className="section-tabs w-fit">
            {TABS.map((item) => (
                <button key={item.key} type="button" onClick={() => setTab(item.key)}
                        className={clsx("section-tab", tab === item.key && "section-tab-active")}>
                    <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                </button>
            ))}
        </nav>

        {tab === "subjects" && <DetailSection title="Materias"
                       description="Cada materia con el profesor, los días y el horario de cada sección."
                       actions={canEdit && <button type="button" className="btn btn-sm btn-primary" onClick={() => setEditing({subject: null})}>
                           <i className="fa fa-plus"/>Agregar materia
                       </button>}>
            {subjectsQuery.isLoading ? <LoadingContent loading className="py-12"/> : subjects.length === 0 ? (
                <EmptyState title="Sin materias" icon="fa-book-open"
                            description="Agrega las materias y, para cada sección, su profesor, días y horario."/>
            ) : (
                <ul className="space-y-3">
                    {subjects.map((subject) => (
                        <SubjectRow key={subject.id} subject={subject} divisions={divisions} canEdit={canEdit}
                                    onEdit={(division) => setEditing({subject, division})} onRemove={() => setSubjectToRemove(subject)}/>
                    ))}
                </ul>
            )}
        </DetailSection>}

        {tab === "evaluations" && canView && <TemplateEvaluationPeriods templateId={id} canEdit={canEdit}/>}

        <RightModal title="Editar curso base" isOpen={canEdit && showEdit} onClose={() => setShowEdit(false)}
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

        <CenterModal title="Inactivar curso base" isOpen={confirmInactivate}
                     onClose={() => !togglingStatus && setConfirmInactivate(false)} className="max-w-md">
            <div className="space-y-5">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    <strong style={{color: "var(--text-primary)"}}>{title}</strong> dejará de generar cursos, ni a mano ni al
                    abrir un nuevo período. Los cursos ya generados no cambian y puedes activarlo de nuevo cuando quieras.
                </p>
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-sm" disabled={togglingStatus} onClick={() => setConfirmInactivate(false)}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-sm bg-[var(--danger)] text-white" disabled={togglingStatus}
                            onClick={() => void toggleStatus()}>
                        <i className={togglingStatus ? "fa fa-spinner fa-spin" : "fa fa-circle-pause"}/>{togglingStatus ? "Inactivando..." : "Sí, inactivar"}
                    </button>
                </div>
            </div>
        </CenterModal>

        <CenterModal title="Remover materia" isOpen={Boolean(subjectToRemove)}
                     onClose={() => !removing && setSubjectToRemove(null)} className="max-w-md">
            <div className="space-y-5">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    ¿Quitar <strong style={{color: "var(--text-primary)"}}>{subjectToRemove?.name}</strong> de este
                    curso base, con sus profesores y horarios? Los cursos dejarán de tenerla cuando se vuelvan a generar.
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
