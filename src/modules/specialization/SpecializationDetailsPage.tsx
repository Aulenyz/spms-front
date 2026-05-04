import {useEffect, useMemo, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {GradeTypeLabel, Specialization} from "../../domain/model/course/Course.ts";
import {SpecializationService} from "../../services/specialization/SpecializationService.ts";
import {RightModal} from "../../components/shared/RightModal.tsx";
import {DropdownSelect} from "../../components/io/input/DropdownSelect.tsx";
import {SelectOption} from "../../components/io/output/Select.tsx";
import {GradeType} from "../../domain/model/course/Course.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

type TabKey = "courses" | "templates" | "teachers" | "settings";

const TABS: Array<{key: TabKey; label: string; icon: string; hint: string}> = [
    {key: "courses", label: "Cursos", icon: "fa-layer-group", hint: "Vinculados"},
    {key: "templates", label: "Plantillas", icon: "fa-copy", hint: "Usos"},
    {key: "teachers", label: "Profesores", icon: "fa-chalkboard-teacher", hint: "Asignaciones"},
    {key: "settings", label: "Ajustes", icon: "fa-gear", hint: "Opciones"},
];

const specializationService = SpecializationService.instance;

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

const typeOptions: SelectOption[] = Object.values(GradeType).map((type) => ({
    value: type,
    description: GradeTypeLabel[type],
}));

export const SpecializationDetailsPage = () => {
    const {hasAuthority} = useAuthContext();
    const {id} = useParams<{id: string}>();
    const [loading, setLoading] = useState(false);
    const [entity, setEntity] = useState<Specialization | null>(null);
    const [tab, setTab] = useState<TabKey>("courses");
    const [showEdit, setShowEdit] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [editValues, setEditValues] = useState<{name: string; description: string; type: GradeType | ""}>({
        name: "",
        description: "",
        type: "",
    });
    const [saving, setSaving] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);

    const title = useMemo(() => entity?.name ?? "Area especializada", [entity?.name]);
    const tabLabel = useMemo(() => TABS.find((item) => item.key === tab)?.label ?? "Cursos", [tab]);

    const refresh = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await specializationService.getOne(id);
            setEntity(response ?? null);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle.");
            setEntity(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, [id]);

    useEffect(() => {
        if (!entity) return;
        setEditValues({
            name: (entity.name ?? "").toString(),
            description: (entity.description ?? "").toString(),
            type: entity.type ?? "",
        });
    }, [entity]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (menuRef.current.contains(event.target as Node)) return;
            setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const renderTable = () => {
        if (!entity && !loading) {
            return (
                <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    No se encontro el detalle.
                </div>
            );
        }

        if (loading) {
            return (
                <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Cargando...
                </div>
            );
        }

        if (tab === "courses") {
            const rows = [
                {name: "Primaria A", division: "A", status: "Activo"},
                {name: "Primaria B", division: "B", status: "Activo"},
                {name: "Primaria C", division: "C", status: "Pendiente"},
            ];

            return (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Curso</th>
                        <th scope="col">Division</th>
                        <th scope="col">Estado</th>
                        <th scope="col" className="text-right"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row) => (
                        <tr key={row.name}>
                            <td><strong>{row.name}</strong></td>
                            <td>{row.division}</td>
                            <td>{row.status}</td>
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

        if (tab === "templates") {
            const rows = [
                {name: "Plantilla 1", sections: 3, type: "Primaria"},
                {name: "Plantilla 2", sections: 2, type: "Secundaria"},
            ];
            return (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Plantilla</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Secciones</th>
                        <th scope="col" className="text-right"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row) => (
                        <tr key={row.name}>
                            <td><strong>{row.name}</strong></td>
                            <td>{row.type}</td>
                            <td>{row.sections}</td>
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

        if (tab === "teachers") {
            const rows = [
                {name: "Ana Perez", status: "Activo"},
                {name: "Juan Rodriguez", status: "Pendiente"},
            ];
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
                    {rows.map((row) => (
                        <tr key={row.name}>
                            <td><strong>{row.name}</strong></td>
                            <td>{row.status}</td>
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
            <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                Aqui agregaremos configuraciones avanzadas cuando este la data real.
            </div>
        );
    };

    return (
        <div className="space-y-5">
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
                            {getInitials(title)}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                            Area especializada:
                        </span>
                        <h2 className="max-w-[min(92vw,720px)] truncate text-xl font-semibold" style={{color: "var(--text-primary)"}}>
                            {title}
                        </h2>
                        {hasAuthority(AuthorityKey.SPECIALIZATION_EDIT) && (
                            <button
                                type="button"
                                className="icon-button h-9 w-9"
                                title="Editar"
                                disabled={!entity}
                                onClick={() => setShowEdit(true)}
                            >
                                <i className="fa fa-pen"/>
                            </button>
                        )}

                        {hasAuthority(AuthorityKey.SPECIALIZATION_STATUS_UPDATE) && <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                className="icon-button h-9 w-9"
                                title="Opciones"
                                disabled={!entity}
                                onClick={() => setShowMenu((value) => !value)}
                            >
                                <i className="fa fa-gear"/>
                            </button>

                            {showMenu && (
                                <div className="floating-panel right-0 mt-2 w-64">
                                    <div className="floating-panel-header">Opciones</div>
                                    <div className="space-y-1 p-2">
                                        <button
                                            type="button"
                                            disabled={!entity || togglingStatus}
                                            onClick={() => {
                                                if (!entity?.id) return;
                                                setTogglingStatus(true);
                                                specializationService
                                                    .updateStatus(entity.id)
                                                    .then(() => {
                                                        toast.success("Estado actualizado.");
                                                        setShowMenu(false);
                                                        void refresh();
                                                    })
                                                    .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el estado."))
                                                    .finally(() => setTogglingStatus(false));
                                            }}
                                            className="profile-menu-item w-full"
                                        >
                                            <i className="fa fa-toggle-on text-[var(--accent)]"/>
                                            <span>{entity?.active ? "Marcar como inactiva" : "Marcar como activa"}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>}
                    </div>

                    <div className="mt-2 text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                        Detalles · {tabLabel}
                    </div>

                    <div className="mt-3 grid w-full max-w-[920px] grid-cols-1 gap-2 text-sm sm:grid-cols-3" style={{color: "var(--text-secondary)"}}>
                        <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-layer-group" style={{color: "var(--text-tertiary)"}}/>
                            <span className="min-w-0 truncate">
                                {entity?.type ? GradeTypeLabel[entity.type] : "Sin tipo"}
                            </span>
                        </div>
                        <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-circle-check" style={{color: "var(--text-tertiary)"}}/>
                            <span className="min-w-0 truncate">
                                {entity ? (entity.active ? "Activa" : "Inactiva") : "-"}
                            </span>
                        </div>
                        <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-align-left" style={{color: "var(--text-tertiary)"}}/>
                            <span className="min-w-0 truncate">
                                {entity?.description ? "Con descripcion" : "Sin descripcion"}
                            </span>
                        </div>
                    </div>

                    <RightModal
                        title="Editar area"
                        isOpen={hasAuthority(AuthorityKey.SPECIALIZATION_EDIT) && showEdit}
                        onClose={() => setShowEdit(false)}
                        className="w-[420px] h-full z-[9999]"
                    >
                        <form
                            className="relative flex h-full flex-col gap-3 px-5 pb-20 pt-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!entity?.id) return;
                                const name = editValues.name.trim();
                                const description = editValues.description.trim();
                                if (!name) return toast.error("El nombre es requerido.");
                                if (!description) return toast.error("La descripcion es requerida.");
                                if (!editValues.type) return toast.error("El tipo es requerido.");
                                setSaving(true);
                                specializationService
                                    .update(entity.id, {name, description, type: editValues.type})
                                    .then(() => {
                                        toast.success("Area actualizada.");
                                        setShowEdit(false);
                                        void refresh();
                                    })
                                    .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar."))
                                    .finally(() => setSaving(false));
                            }}
                        >
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                    Nombre*
                                </label>
                                <label className="input input-sm w-full">
                                    <i className="fa fa-book-open me-1"/>
                                    <input
                                        value={editValues.name}
                                        onChange={(e) => setEditValues((p) => ({...p, name: e.target.value}))}
                                        placeholder="Nombre del area"
                                        maxLength={40}
                                    />
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                    Descripcion*
                                </label>
                                <label className="input input-sm w-full">
                                    <i className="fa fa-align-left me-1"/>
                                    <input
                                        value={editValues.description}
                                        onChange={(e) => setEditValues((p) => ({...p, description: e.target.value}))}
                                        placeholder="Descripcion del area"
                                    />
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                    Tipo*
                                </label>
                                <DropdownSelect
                                    text="Seleccionar tipo"
                                    hasError={false}
                                    options={typeOptions}
                                    value={editValues.type}
                                    onSelect={(value) => setEditValues((p) => ({...p, type: value as GradeType}))}
                                    className="w-full"
                                />
                            </div>

                            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                                <button type="button" className="btn btn-sm" onClick={() => setShowEdit(false)} disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                                    {saving ? "Guardando..." : "Guardar"}
                                    <i className="fa fa-save ms-2"/>
                                </button>
                            </div>
                        </form>
                    </RightModal>
                </div>
            </div>

            <div className="surface-card">
                <div className="surface-card-header">
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {TABS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setTab(item.key)}
                                    className={clsx("section-tab", tab === item.key && "section-tab-active")}
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
                            <span>Nuevo</span>
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
                        {renderTable()}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                        <span>Mostrando 1 - 1 de 1</span>
                        <span className="inline-flex items-center gap-2">
                            <button className="icon-button h-8 w-8" type="button" disabled title="Anterior"><i className="fa fa-chevron-left text-[10px]"/></button>
                            <button className="icon-button h-8 w-8" type="button" disabled title="Siguiente"><i className="fa fa-chevron-right text-[10px]"/></button>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
