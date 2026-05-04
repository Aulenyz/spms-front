import {Link} from "react-router-dom";
import {Specialization} from "../../domain/model/course/Course.ts";
import {GradeTypePill} from "../../components/io/output/pill/GradeTypePill.tsx";

interface Props {
    specialization: Specialization;
}

export const SpecializationCard = ({specialization}: Props) => {
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
            className="group relative flex h-full min-h-[230px] flex-col overflow-hidden rounded-[24px] border transition-all duration-200 hover:-translate-y-1"
            style={{
                borderColor: "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            {/* Accent strip */}
            <div
                className="absolute left-0 top-0 h-full w-1.5"
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
                    </div>

                    <p className="line-clamp-3 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                        {specialization.description || "Sin descripcion registrada para esta area especializada."}
                    </p>
                </div>

                <div className="pt-1">
                    <Link
                        to={`/specializations/${specialization.id}`}
                        className="table-link inline-flex items-center gap-2"
                    >
                        <span>Detalles</span>
                        <i className="fa fa-chevron-right text-2xs transition-transform duration-200 group-hover:translate-x-0.5"/>
                    </Link>
                </div>
            </div>
        </article>
    );
};
