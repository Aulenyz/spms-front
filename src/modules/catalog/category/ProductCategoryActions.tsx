export const ProductCategoryActions = ({
    counts,
    onCreate,
}: {
    counts: Record<string, number>;
    onCreate: () => void;
}) => {
    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
            style={{
                borderColor: "var(--border-soft)",
                background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold"
                    style={{borderColor: "color-mix(in srgb, var(--success) 28%, transparent)", background: "var(--success-soft)", color: "var(--success)"}}
                >
                    <span className="h-2 w-2 rounded-full" style={{background: "var(--success)"}}/>
                    Activas: {counts.true ?? 0}
                </span>
                <span
                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold"
                    style={{borderColor: "color-mix(in srgb, var(--danger) 28%, transparent)", background: "rgba(209, 79, 92, 0.12)", color: "var(--danger)"}}
                >
                    <span className="h-2 w-2 rounded-full" style={{background: "var(--danger)"}}/>
                    Inactivas: {counts.false ?? 0}
                </span>
            </div>

            <button type="button" className="btn btn-sm btn-primary" onClick={onCreate}>
                <i className="fa fa-plus me-1"/>
                Nueva categoría
            </button>
        </div>
    );
};
