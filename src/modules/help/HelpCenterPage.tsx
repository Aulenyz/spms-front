import {useMemo, useState} from "react";
import clsx from "clsx";
import {DropdownSelect} from "../../components/io/input/DropdownSelect.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {
    helpAreaOptions,
    helpArticles,
    HelpArea,
    HelpType,
    helpTypeOptions,
} from "../../domain/model/help/helpCenter.ts";

const countByType = (type: HelpType) => helpArticles.filter((article) => article.type === type).length;

const statCards: Array<{label: string; value: string; icon: string; tone: string}> = [
    {label: "Preguntas frecuentes", value: String(helpArticles.length), icon: "fa-circle-question", tone: "var(--accent)"},
    {label: "Temas de acceso", value: String(countByType("Acceso")), icon: "fa-key", tone: "#0f766e"},
    {label: "Procesos académicos", value: String(countByType("Académico")), icon: "fa-user-graduate", tone: "#2563eb"},
    {label: "Errores comunes", value: String(countByType("Errores")), icon: "fa-triangle-exclamation", tone: "#d97706"},
];

export const HelpCenterPage = () => {
    const [term, setTerm] = useState("");
    const [type, setType] = useState<"" | HelpType>("");
    const [area, setArea] = useState<"" | HelpArea>("");
    const [openId, setOpenId] = useState<string>(helpArticles[0]?.id ?? "");

    const filteredArticles = useMemo(() => {
        const normalized = term.trim().toLowerCase();
        return helpArticles.filter((article) => {
            const matchesType = !type || article.type === type;
            const matchesArea = !area || article.area === area;
            const haystack = [
                article.title,
                article.question,
                article.answer,
                article.area,
                article.type,
                article.tags.join(" "),
                article.solution.join(" "),
            ].join(" ").toLowerCase();
            const matchesTerm = !normalized || haystack.includes(normalized);
            return matchesType && matchesArea && matchesTerm;
        });
    }, [area, term, type]);

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Centro de ayuda"
                title="Ayuda y preguntas frecuentes"
                description="Consulta soluciones rápidas para accesos, cobros, estudiantes, cursos, roles y errores comunes del sistema."
            />

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((item) => (
                    <article
                        key={item.label}
                        className="rounded-[24px] border p-5"
                        style={{
                            borderColor: "var(--border-soft)",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow-card)",
                        }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em]"
                                   style={{color: "var(--text-tertiary)"}}>
                                    {item.label}
                                </p>
                                <p className="text-2xl font-semibold" style={{color: "var(--text-primary)"}}>
                                    {item.value}
                                </p>
                            </div>
                            <span
                                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                style={{
                                    background: `color-mix(in srgb, ${item.tone} 14%, white)`,
                                    color: item.tone,
                                }}
                            >
                                <i className={`fa ${item.icon}`}/>
                            </span>
                        </div>
                    </article>
                ))}
            </section>

            <DataTableCard
                title="Base local de ayuda"
                description="Filtra por tipo, área o palabra clave para encontrar la respuesta más rápido."
                status={<span className="page-header-eyebrow">Resultados: {filteredArticles.length}</span>}
                filters={
                    <div className="flex flex-wrap items-end gap-2.5">
                        <div className="w-full sm:w-[190px]">
                            <DropdownSelect
                                text="Tipo"
                                hasError={false}
                                value={type}
                                onSelect={(value) => setType((value ?? "") as "" | HelpType)}
                                className="w-full"
                                options={helpTypeOptions}
                                portal
                            />
                        </div>

                        <div className="w-full sm:w-[220px]">
                            <DropdownSelect
                                text="Área"
                                hasError={false}
                                value={area}
                                onSelect={(value) => setArea((value ?? "") as "" | HelpArea)}
                                className="w-full"
                                options={helpAreaOptions}
                                portal
                            />
                        </div>

                        <div className="w-full sm:w-[320px]">
                            <label className="input input-sm flex w-full items-center gap-2">
                                <i className="fa fa-magnifying-glass text-xs"/>
                                <input
                                    type="text"
                                    value={term}
                                    onChange={(event) => setTerm(event.target.value)}
                                    placeholder="Buscar por problema, módulo o solución..."
                                />
                            </label>
                        </div>
                    </div>
                }
            >
                {filteredArticles.length === 0 ? (
                    <EmptyState
                        title="No encontramos artículos"
                        description="Prueba otra palabra clave o cambia los filtros para ver más resultados."
                        icon="fa-circle-question"
                    />
                ) : (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
                        <div className="space-y-4">
                            {filteredArticles.map((article) => {
                                const isOpen = openId === article.id;
                                return (
                                    <article
                                        key={article.id}
                                        className="rounded-[24px] border transition-all"
                                        style={{
                                            borderColor: isOpen ? "var(--accent)" : "var(--border-soft)",
                                            background: isOpen
                                                ? "color-mix(in srgb, var(--accent-soft) 18%, var(--surface))"
                                                : "var(--surface)",
                                            boxShadow: "var(--shadow-card)",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenId((current) => current === article.id ? "" : article.id)}
                                            className="flex w-full items-start justify-between gap-4 p-5 text-left"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
                                                        style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}
                                                    >
                                                        {article.type}
                                                    </span>
                                                    <span
                                                        className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold"
                                                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                                                    >
                                                        {article.area}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-base font-semibold" style={{color: "var(--text-primary)"}}>
                                                        {article.title}
                                                    </h3>
                                                    <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                                        {article.question}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={clsx("mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border transition-transform", {
                                                    "rotate-180": isOpen,
                                                })}
                                                style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}
                                            >
                                                <i className="fa fa-chevron-down text-xs"/>
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <div className="space-y-4 border-t px-5 pb-5 pt-4"
                                                 style={{borderColor: "var(--border-soft)"}}>
                                                <div className="rounded-[20px] border p-4"
                                                     style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                                    <p className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                                        Respuesta rápida
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                                        {article.answer}
                                                    </p>
                                                </div>

                                                <div className="space-y-3">
                                                    <p className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                                        Cómo resolverlo
                                                    </p>
                                                    <div className="space-y-2">
                                                        {article.solution.map((step, index) => (
                                                            <div key={`${article.id}-step-${index}`}
                                                                 className="flex items-start gap-3 rounded-[18px] border px-4 py-3"
                                                                 style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                                                <span
                                                                    className="inline-flex h-7 min-w-7 items-center justify-center rounded-full text-xs font-bold"
                                                                    style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                                                    {index + 1}
                                                                </span>
                                                                <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                                                    {step}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>

                        <aside className="space-y-4">
                            <section
                                className="rounded-[24px] border p-5"
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: "var(--surface)",
                                    boxShadow: "var(--shadow-card)",
                                }}
                            >
                                <div className="space-y-2">
                                    <h3 className="text-base font-semibold" style={{color: "var(--text-primary)"}}>
                                        Qué incluye esta ayuda
                                    </h3>
                                    <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                        Esta base local cubre las operaciones más comunes del sistema y los errores que el usuario puede encontrar durante el uso diario.
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {helpTypeOptions
                                        .filter((option) => option.value)
                                        .map((option) => (
                                            <button
                                                key={option.value as string}
                                                type="button"
                                                onClick={() => setType(option.value as HelpType)}
                                                className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                                                style={{
                                                    background: type === option.value ? "var(--accent-soft)" : "var(--surface-muted)",
                                                    color: type === option.value ? "var(--accent)" : "var(--text-secondary)",
                                                }}
                                            >
                                                {option.description}
                                            </button>
                                        ))}
                                </div>
                            </section>

                            <section
                                className="rounded-[24px] border p-5"
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: "linear-gradient(180deg, color-mix(in srgb, var(--surface-muted) 88%, white) 0%, var(--surface) 100%)",
                                    boxShadow: "var(--shadow-card)",
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                                    >
                                        <i className="fa fa-life-ring"/>
                                    </span>
                                    <div className="space-y-2">
                                        <h3 className="text-base font-semibold" style={{color: "var(--text-primary)"}}>
                                            Si no encuentras la respuesta
                                        </h3>
                                        <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                            Reúne el nombre del módulo, el mensaje de error y el espacio de trabajo actual. Eso ayuda a que un administrador o soporte revise el caso más rápido.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </aside>
                    </div>
                )}
            </DataTableCard>
        </div>
    );
};
