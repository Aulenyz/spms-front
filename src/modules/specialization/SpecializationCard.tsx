import {useMemo} from "react";
import {Link} from "react-router-dom";
import {GradeTypeLabel, Specialization} from "../../domain/model/course/Course.ts";

interface Props {
    specialization: Specialization;
}

const SPECIALIZATION_GRADIENTS = [
    "linear-gradient(135deg, #0f62fe, #2563eb)",
    "linear-gradient(135deg, #12805c, #0f766e)",
    "linear-gradient(135deg, #c47b07, #ea580c)",
    "linear-gradient(135deg, #7c3aed, #9333ea)",
];

export const SpecializationCard = ({specialization}: Props) => {
    const initials = specialization.name
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    const headerGradient = useMemo(() => {
        const hash = specialization.name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
        return SPECIALIZATION_GRADIENTS[hash % SPECIALIZATION_GRADIENTS.length];
    }, [specialization.name]);

    const statusLabel = specialization.active ? "Activa" : "Inactiva";
    const statusStyle = specialization.active
        ? {background: "var(--success-soft)", color: "var(--success)"}
        : {background: "rgba(209, 79, 92, 0.12)", color: "var(--danger)"};

    return (
        <article
            className="flex h-full min-h-[258px] flex-col overflow-hidden rounded-[24px] border transition-all duration-200 hover:-translate-y-1"
            style={{
                borderColor: "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div className="flex h-28 items-center justify-between px-5 py-4" style={{background: headerGradient}}>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/18 text-2xl font-semibold text-white backdrop-blur-sm">
                    {initials}
                </span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold" style={statusStyle}>
                    {statusLabel}
                </span>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                <div className="space-y-3">
                    <h3 className="text-base font-semibold leading-6" style={{color: "var(--text-primary)"}}>
                        {specialization.name}
                    </h3>
                    <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                        {specialization.description || "Sin descripcion registrada para esta unidad."}
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 text-sm" style={{color: "var(--text-secondary)"}}>
                        <i className="fa fa-layer-group"/>
                        <span>{GradeTypeLabel[specialization.type]}</span>
                    </div>

                    <Link
                        to={`/specializations/${specialization.id}`}
                        className="table-link"
                    >
                        Detalles
                        <i className="fa fa-chevron-right text-2xs"/>
                    </Link>
                </div>
            </div>
        </article>
    );
};
