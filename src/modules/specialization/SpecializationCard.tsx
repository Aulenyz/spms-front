import {useEffect, useRef, useState} from "react";
import {Specialization} from "../../domain/model/course/Course.ts";
import {GradeTypePill} from "../../components/io/output/pill/GradeTypePill.tsx";

interface Props {
    specialization: Specialization;
    /** Abre la edición; sin él el menú no la ofrece. */
    onEdit?: () => void;
    /** Activa o inactiva el área; sin él el menú no lo ofrece. */
    onToggleStatus?: () => Promise<unknown>;
}

/** Tarjeta de un área especializada; el engranaje abre Editar y Activar/Inactivar, como en Materias. */
export const SpecializationCard = ({specialization, onEdit, onToggleStatus}: Props) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [toggling, setToggling] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    const toggleStatus = () => {
        if (!onToggleStatus) return;
        setToggling(true);
        onToggleStatus().then(() => setMenuOpen(false)).finally(() => setToggling(false));
    };

    const initials = specialization.name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    const statusLabel = specialization.active ? "Activa" : "Inactiva";
    const statusStyle = specialization.active
        ? {background: "var(--success-soft)", color: "var(--success)"}
        : {background: "rgba(209, 79, 92, 0.12)", color: "var(--danger)"};

    return (
        <article
            className="group relative flex h-full min-h-[230px] flex-col overflow-visible rounded-[24px] border transition-all duration-200 hover:-translate-y-1"
            style={{
                borderColor: "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            {/* Accent strip */}
            <div
                className="absolute left-0 top-0 h-full w-1.5 rounded-l-[24px]"
                style={{
                    background: specialization.active
                        ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 65%, white))"
                        : "linear-gradient(180deg, color-mix(in srgb, var(--text-tertiary) 80%, white), var(--muted))",
                }}
            />

            <div className="flex flex-1 flex-col justify-between gap-3 p-5">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                            <span
                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-sm font-extrabold"
                                style={{
                                    background: "color-mix(in srgb, var(--accent-soft) 72%, transparent)",
                                    color: "var(--accent)",
                                    boxShadow: "inset 0 0 0 1px var(--border-soft)",
                                }}
                            >
                                {initials}
                            </span>
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold leading-6" style={{color: "var(--text-primary)"}}>
                                    {specialization.name}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={statusStyle}>
                                        {statusLabel}
                                    </span>
                                    <GradeTypePill type={specialization.type}/>
                                </div>
                            </div>
                        </div>

                        {(onEdit || onToggleStatus) && (
                            <div className="relative flex-shrink-0" ref={menuRef}>
                                <button type="button" className="icon-button h-9 w-9" title="Opciones"
                                        aria-label={`Opciones de ${specialization.name}`} aria-expanded={menuOpen}
                                        onClick={() => setMenuOpen((open) => !open)}>
                                    <i className="fa fa-gear text-sm"/>
                                </button>
                                {menuOpen && (
                                    <div className="floating-panel right-0 top-full z-20 mt-2 w-64">
                                        <div className="floating-panel-header">Opciones</div>
                                        <div className="space-y-1 p-2">
                                            {onEdit && (
                                                <button type="button" className="profile-menu-item w-full"
                                                        onClick={() => {
                                                            setMenuOpen(false);
                                                            onEdit();
                                                        }}>
                                                    <i className="fa fa-pen text-[var(--accent)]"/>
                                                    <span>Editar área</span>
                                                </button>
                                            )}
                                            {onToggleStatus && (
                                                <button type="button" className="profile-menu-item w-full" disabled={toggling} onClick={toggleStatus}>
                                                    <i className={`fa ${toggling ? "fa-spinner fa-spin" : "fa-toggle-on"} text-[var(--accent)]`}/>
                                                    <span>{specialization.active ? "Marcar como inactiva" : "Marcar como activa"}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="line-clamp-3 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                        {specialization.description || "Sin descripción registrada para esta área especializada."}
                    </p>
                </div>
            </div>
        </article>
    );
};
