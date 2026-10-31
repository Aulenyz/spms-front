import {useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";

import {queryKeys} from "../../../app/query/queryKeys.ts";
import {GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {Subject} from "../../../domain/model/course/Subject.ts";
import {CourseTemplateService, TemplateSubject} from "../../../services/course/CourseTemplateService.ts";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {Badge} from "../../../components/ui/detail/StatusBadge.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {CourseTemplateForm} from "./CourseTemplateForm.tsx";

const service = CourseTemplateService.instance;
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message : fallback;

/**
 * Plantilla de curso: define el nombre, las secciones y las materias. Los profesores se asignan en
 * cada curso generado.
 */
export const CourseTemplateDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const canView = hasAuthority(AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW);
    const canEdit = hasAuthority(AuthorityKey.COURSE_TEMPLATE_EDIT);
    const canGenerate = hasAuthority(AuthorityKey.COURSE_GENERATE);

    const [showEdit, setShowEdit] = useState(false);
    const [showAddSubject, setShowAddSubject] = useState(false);
    const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
    const [subjectId, setSubjectId] = useState("");
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [subjectToRemove, setSubjectToRemove] = useState<TemplateSubject | null>(null);
    const [removing, setRemoving] = useState(false);

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
    const subjects: TemplateSubject[] = subjectsQuery.data ?? [];

    const searchSubjects = (term: string = "") => {
        if (!id) return;
        service.subjectOptions(id, term).then(setSubjectOptions, () => toast.error("No se pudieron buscar las materias."));
    };

    const openAddSubject = () => {
        setSubjectId("");
        searchSubjects();
        setShowAddSubject(true);
    };

    const addSubject = async () => {
        if (!id || !subjectId) return;
        setSaving(true);
        try {
            await service.addTemplateSubject(id, Number(subjectId));
            await queryClient.invalidateQueries({queryKey: subjectsKey});
            setShowAddSubject(false);
            toast.success("Materia agregada a la plantilla.");
        } catch (error) {
            toast.error(message(error, "No se pudo agregar la materia."));
        } finally {
            setSaving(false);
        }
    };

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
            toast.success("Cursos del período actualizados con las materias de la plantilla.");
        } catch (error) {
            toast.error(message(error, "No se pudieron generar los cursos."));
        } finally {
            setGenerating(false);
        }
    };

    if (templateQuery.isLoading) return <LoadingContent loading className="py-16"/>;
    if (!template) return <EmptyState title="No se encontró la plantilla"
                                      description="Vuelve al listado e intenta nuevamente." icon="fa-layer-group"/>;

    const title = template.name ?? template.specialization?.name ?? "Plantilla";
    const sections = template.count ?? 0;

    return <div className="space-y-4">
        <DetailHeader
            avatar={title}
            title={title}
            subtitle={[template.type ? GradeTypeLabel[template.type] : null, template.specialization?.name].filter(Boolean).join(" · ") || "Sin área especializada"}
            badges={<>
                <Badge>{sections} {sections === 1 ? "sección" : "secciones"}</Badge>
                <Badge>{subjects.length} {subjects.length === 1 ? "materia" : "materias"}</Badge>
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

        <DetailSection title="Materias"
                       description="Cada curso generado desde esta plantilla incluye estas materias. Los profesores se asignan en cada curso."
                       flush
                       actions={canEdit && <button type="button" className="btn btn-sm btn-primary" onClick={openAddSubject}>
                           <i className="fa fa-plus"/>Agregar materia
                       </button>}>
            {subjectsQuery.isLoading ? <LoadingContent loading className="py-12"/> : subjects.length ? (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Descripción</th>
                        {canEdit && <th className="w-12"/>}
                    </tr>
                    </thead>
                    <tbody>
                    {subjects.map((item) => (
                        <tr key={item.id}>
                            <td className="font-semibold text-[var(--text-primary)]">{item.name}</td>
                            <td>{item.description || "—"}</td>
                            {canEdit && <td className="text-right">
                                <button type="button" className="row-action row-action-danger" title="Remover materia"
                                        aria-label="Remover materia" onClick={() => setSubjectToRemove(item)}>
                                    <i className="fa fa-trash"/>
                                </button>
                            </td>}
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <div className="p-5">
                    <EmptyState title="Sin materias" icon="fa-book-open"
                                description="Agrega las materias que tendrán los cursos de esta plantilla."/>
                </div>
            )}
        </DetailSection>

        <RightModal title="Editar plantilla" isOpen={canEdit && showEdit} onClose={() => setShowEdit(false)}
                    className="h-full w-[420px] z-[9999]">
            <CourseTemplateForm initial={template} onDone={() => setShowEdit(false)}
                                onSaved={() => void queryClient.invalidateQueries({queryKey: templateKey})}/>
        </RightModal>

        <LeftModal title="Agregar materia" isOpen={showAddSubject} onClose={() => setShowAddSubject(false)}
                   className="h-full w-[min(480px,100vw)]">
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
                event.preventDefault();
                void addSubject();
            }}>
                <div className="min-h-0 flex-1 overflow-y-auto pb-4 pr-1">
                    <label className="block"><span className="form-label">Materia *</span>
                        <SearchSelect text="Buscar por nombre o código" hasError={false} portal
                                      value={subjectId || undefined}
                                      options={subjectOptions.map((subject) => ({
                                          value: subject.id,
                                          description: `${subject.name}${subject.code ? ` · ${subject.code}` : ""}`,
                                      }))}
                                      onSearch={searchSubjects}
                                      onSelect={(value) => setSubjectId(value?.toString() ?? "")}
                                      className="w-full"/>
                    </label>
                </div>
                <div className="flex justify-end border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !subjectId}>
                        <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{saving ? "Guardando..." : "Agregar"}
                    </button>
                </div>
            </form>
        </LeftModal>

        <CenterModal title="Remover materia" isOpen={Boolean(subjectToRemove)}
                     onClose={() => !removing && setSubjectToRemove(null)} className="max-w-md">
            <div className="space-y-5">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    ¿Quitar <strong style={{color: "var(--text-primary)"}}>{subjectToRemove?.name}</strong> de esta
                    plantilla? Los cursos dejarán de tenerla cuando se vuelvan a generar.
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
