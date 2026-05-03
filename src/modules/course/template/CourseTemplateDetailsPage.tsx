import {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {CourseTemplate, GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {CourseTemplateForm} from "./CourseTemplateForm.tsx";


const courseTemplateService = CourseTemplateService.instance;

type SectionKey = "subjects" | "teachers" | "active_teachers" | "settings";

const NAV_ITEMS: Array<{key: SectionKey; label: string; icon: string; hint: string}> = [
    {key: "subjects", label: "Materias", icon: "fa-book-open", hint: "Listado base"},
    {key: "teachers", label: "Profesores", icon: "fa-chalkboard-teacher", hint: "Asignaciones"},
    {key: "active_teachers", label: "Actuales", icon: "fa-user-check", hint: "Profesores activos"},
    {key: "settings", label: "Ajustes", icon: "fa-gear", hint: "Opciones"},
];

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const getInitials = (value: string) =>
    value
        .split(" ")
        .map((word) => word.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

export const CourseTemplateDetailsPage = () => {
    const {id} = useParams<{id: string}>();

    const [loading, setLoading] = useState(false);
    const [template, setTemplate] = useState<CourseTemplate | null>(null);
    const [active, setActive] = useState<SectionKey>("subjects");
    const [showEdit, setShowEdit] = useState(false);

    const templateTitle = useMemo(() => {
        if (!template) return "Plantilla";
        return template.name ?? template.specialization?.name ?? "Plantilla";
    }, [template]);

    const refresh = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await courseTemplateService.getOne(id);
            setTemplate(response ?? null);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo cargar la plantilla.");
            setTemplate(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, [id]);

    const sectionActionLabel = useMemo(() => {
        if (active === "subjects") return "Registrar Materia";
        if (active === "teachers") return "Asignar Profesor";
        if (active === "active_teachers") return "Gestionar";
        return "Configurar";
    }, [active]);

    const renderContent = () => {
        if (!template && !loading) {
            return (
                <EmptyState
                    title="No se encontro la plantilla"
                    description="Vuelve al listado e intenta nuevamente."
                    icon="fa-layer-group"
                />
            );
        }

        const subjects = ["Matematicas", "Lengua Espanola", "Ciencias Naturales", "Historia", "Ingles", "Educacion Fisica"];
        const teacherAssignments = [
            {name: "Ana Perez", subject: "Matematicas", status: "Asignado"},
            {name: "Juan Rodriguez", subject: "Lengua Espanola", status: "Pendiente"},
            {name: "Maria Lopez", subject: "Ciencias Naturales", status: "Asignado"},
        ];
        const activeTeachers = ["Ana Perez", "Maria Lopez", "Carlos Gomez", "Laura Castillo"];

        if (active === "subjects") {
            return (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Materia</th>
                        <th scope="col">Seccion sugerida</th>
                        <th scope="col">Estado</th>
                        <th scope="col" className="text-right"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {subjects.map((name) => (
                        <tr key={name}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <span
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold"
                                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                                    >
                                        {getInitials(name)}
                                    </span>
                                    <strong>{name}</strong>
                                </div>
                            </td>
                            <td>{Math.min(template?.count ?? 1, 3)}</td>
                            <td>
                                <span className="inline-flex items-center gap-2 text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full" style={{background: "var(--success)"}}/>
                                    Activa
                                </span>
                            </td>
                            <td className="text-right">
                                <button className="table-link" type="button" disabled>
                                    Detalles <i className="fa fa-chevron-right text-[10px]"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            );
        }

        if (active === "teachers") {
            return (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Profesor</th>
                        <th scope="col">Materia</th>
                        <th scope="col">Estado</th>
                        <th scope="col" className="text-right"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {teacherAssignments.map((row) => (
                        <tr key={row.name}>
                            <td><strong>{row.name}</strong></td>
                            <td>{row.subject}</td>
                            <td>
                                <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                        background: row.status === "Asignado" ? "var(--accent-soft)" : "var(--muted)",
                                        color: row.status === "Asignado" ? "var(--accent)" : "var(--text-secondary)",
                                    }}
                                >
                                    {row.status}
                                </span>
                            </td>
                            <td className="text-right">
                                <button className="table-link" type="button" disabled>
                                    Detalles <i className="fa fa-chevron-right text-[10px]"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            );
        }

        if (active === "active_teachers") {
            return (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Profesor</th>
                        <th scope="col">Estado</th>
                        <th scope="col" className="text-right"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {activeTeachers.map((name) => (
                        <tr key={name}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <span
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold"
                                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                                    >
                                        {getInitials(name)}
                                    </span>
                                    <strong>{name}</strong>
                                </div>
                            </td>
                            <td>
                                <span className="inline-flex items-center gap-2 text-sm font-medium">
                                    <span className="h-2 w-2 rounded-full" style={{background: "var(--success)"}}/>
                                    Activo
                                </span>
                            </td>
                            <td className="text-right">
                                <button className="table-link" type="button" disabled>
                                    Detalles <i className="fa fa-chevron-right text-[10px]"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            );
        }

        return (
            <div className="p-4 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                Aqui agregaremos configuraciones avanzadas cuando este la data real.
            </div>
        );
    };

    return (
        <div className="space-y-5">
            <div>
                <div
                    className="px-4 pb-4 pt-8 sm:px-6 sm:pb-5"
                    style={{
                        background:
                            "radial-gradient(circle at top, rgba(15, 98, 254, 0.08), transparent 55%)," +
                            "radial-gradient(circle at top right, rgba(18, 128, 92, 0.06), transparent 45%)," +
                            "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))",
                    }}
                >
                    <div className="mx-auto flex w-full max-w-[1480px] flex-col items-center text-center">
                        <div
                            className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border"
                            style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}
                        >
                            <span className="text-2xl font-extrabold" style={{color: "var(--accent)"}}>
                                {getInitials(templateTitle)}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                                Curso:
                            </span>
                            <h2 className="max-w-[min(92vw,720px)] truncate text-xl font-semibold" style={{color: "var(--text-primary)"}}>
                                {templateTitle}
                            </h2>
                            <button
                                type="button"
                                className="icon-button h-9 w-9"
                                title="Editar"
                                disabled={!template}
                                onClick={() => setShowEdit(true)}
                            >
                                <i className="fa fa-pen"/>
                            </button>
                        </div>

                        <div
                            className="mt-3 grid w-full max-w-[920px] grid-cols-1 gap-2 text-sm sm:grid-cols-3"
                            style={{color: "var(--text-secondary)"}}
                        >
                            <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <i className="fa fa-layer-group" style={{color: "var(--text-tertiary)"}}/>
                                <span className="min-w-0 truncate">
                                    {template?.type ? GradeTypeLabel[template.type] : "Sin tipo"}
                                </span>
                            </div>
                            <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <i className="fa fa-hashtag" style={{color: "var(--text-tertiary)"}}/>
                                <span className="min-w-0 truncate">
                                    {template?.count ?? "-"} secciones
                                </span>
                            </div>
                            <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <i className="fa fa-book" style={{color: "var(--text-tertiary)"}}/>
                                <span className="min-w-0 truncate">
                                {template?.specialization?.name ?? "Sin área especializada"}
                                </span>
                            </div>
                        </div>

                        <RightModal
                            title="Editar plantilla"
                            isOpen={showEdit}
                            onClose={() => setShowEdit(false)}
                            className="w-[420px] h-full z-[9999]"
                        >
                            <CourseTemplateForm
                                initial={template}
                                onDone={() => setShowEdit(false)}
                                onSaved={refresh}
                            />
                        </RightModal>
                    </div>
                </div>
            </div>

            <div className="surface-card">
                <div className="surface-card-header">
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setActive(item.key)}
                                    className={clsx("section-tab", active === item.key && "section-tab-active")}
                                >
                                    <i className={clsx("fa", item.icon)}/>
                                    <span>{item.label}</span>
                                    <small>{item.hint}</small>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button className="btn btn-sm btn-primary" type="button" disabled>
                            <i className="fa fa-plus me-1"/>
                            <span>{sectionActionLabel}</span>
                        </button>
                    </div>
                </div>

                <div className="data-table-card-body">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <div className="toggle-pill">
                                <span className="toggle-pill-dot" style={{background: "var(--accent)"}}/>
                                <span className="toggle-pill-label">Mostrando elementos activos</span>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                            <div className="w-full sm:w-[140px]">
                                <button type="button" className="input select select-sm search-select-input w-full cursor-pointer" disabled>
                                    Nombre
                                </button>
                            </div>
                            <label className="input input-sm w-full sm:w-[260px]">
                                <i className="fa fa-search me-1"/>
                                <input disabled placeholder="Buscar..." />
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[22px] border" style={{borderColor: "var(--border-soft)"}}>
                        {loading ? (
                            <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                                Cargando...
                            </div>
                        ) : (
                            renderContent()
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                        <span>Mostrando {active === "subjects" ? "6" : active === "teachers" ? "3" : active === "active_teachers" ? "4" : "0"} elementos</span>
                        <span className="inline-flex items-center gap-2">
                            <span>1 - 1 de 1</span>
                            <button className="icon-button h-8 w-8" type="button" disabled title="Anterior"><i className="fa fa-chevron-left text-[10px]"/></button>
                            <button className="icon-button h-8 w-8" type="button" disabled title="Siguiente"><i className="fa fa-chevron-right text-[10px]"/></button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
