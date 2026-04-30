type TemplateInfoCardProps = {
    title: string;
    subtitle: string;
    badge: string;
    accent: string;
    details: Array<{label: string; value: string | number}>;
};

export const TemplateInfoCard = ({title, subtitle, badge, accent, details}: TemplateInfoCardProps) => {
    return (
        <article
            className="flex h-full min-h-[248px] flex-col overflow-hidden rounded-[24px] border"
            style={{
                borderColor: "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div className="px-5 py-4" style={{background: accent}}>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.10em] text-white/78">Plantilla</p>
                        <h3 className="text-lg font-semibold leading-6">{title}</h3>
                    </div>
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white">
                        {badge}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 p-5">
                <p className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                    {subtitle}
                </p>

                <div className="grid gap-3">
                    {details.map((detail) => (
                        <div
                            key={detail.label}
                            className="flex items-center justify-between rounded-[16px] border px-4 py-3"
                            style={{
                                borderColor: "var(--border-soft)",
                                background: "var(--surface-muted)",
                            }}
                        >
                            <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{color: "var(--text-tertiary)"}}>
                                {detail.label}
                            </span>
                            <span className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                {detail.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </article>
    );
};
