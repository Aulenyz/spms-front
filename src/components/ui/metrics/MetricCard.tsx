type MetricCardProps = {
    title: string;
    value: string;
    delta?: string;
    icon: string;
    tone?: "brand" | "success" | "warning" | "danger";
};

export const MetricCard = ({
    title,
    value,
    delta,
    icon,
    tone = "brand",
}: MetricCardProps) => {
    return (
        <article className={`metric-card metric-card-${tone}`}>
            <div className="space-y-3">
                <span className="metric-card-label">{title}</span>
                <div className="space-y-1">
                    <strong className="metric-card-value">{value}</strong>
                    {delta && <p className="metric-card-delta">{delta}</p>}
                </div>
            </div>
            <div className="metric-card-icon">
                <i className={`fa ${icon}`}/>
            </div>
        </article>
    );
};
