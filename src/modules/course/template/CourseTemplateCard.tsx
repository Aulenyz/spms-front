import {useMemo} from "react";
import {CourseTemplate, GradeTypeLabel} from "../../../domain/model/course/Course";

interface Props {
    courseTemplate: CourseTemplate;
}

const TEMPLATE_GRADIENTS = [
    "linear-gradient(135deg, #0f62fe, #2563eb)",
    "linear-gradient(135deg, #12805c, #0f766e)",
    "linear-gradient(135deg, #c47b07, #ea580c)",
    "linear-gradient(135deg, #7c3aed, #9333ea)",
];

export const CourseTemplateCard = ({courseTemplate}: Props) => {
    const {specialization, count} = courseTemplate;
    const {name, description, type} = specialization;

    const initials = useMemo(() => (
        name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join("")
    ), [name]);

    const headerGradient = useMemo(() => {
        const hash = name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
        return TEMPLATE_GRADIENTS[hash % TEMPLATE_GRADIENTS.length];
    }, [name]);

    return (
        <article
            className="flex h-full min-h-[258px] flex-col overflow-hidden rounded-[24px] border transition-all duration-200 hover:-translate-y-1"
            style={{
                borderColor: "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div
                className="flex h-28 items-center justify-between px-5 py-4"
                style={{background: headerGradient}}
            >
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/18 text-2xl font-semibold text-white backdrop-blur-sm">
                    {initials}
                </span>
                <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                    {count} secciones
                </span>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                <div className="space-y-3">
                    <h3 className="text-base font-semibold leading-6" style={{color: "var(--text-primary)"}}>
                        {name}
                    </h3>
                    <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                        {description || "Sin descripcion registrada para esta plantilla."}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-3 border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                    <div className="inline-flex items-center gap-2 text-sm" style={{color: "var(--text-secondary)"}}>
                        <i className="fa fa-layer-group"/>
                        <span>{GradeTypeLabel[type]}</span>
                    </div>
                    <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                    >
                        Activa
                    </span>
                </div>
            </div>
        </article>
    );
};
