import {ProductStatus, ProductStatusLabel} from "../../../domain/model/product/Product.ts";

const statusStyle: Record<ProductStatus, {bg: string; color: string; border: string}> = {
    [ProductStatus.ACTIVE]: {
        bg: "var(--success-soft)",
        color: "var(--success)",
        border: "color-mix(in srgb, var(--success) 28%, transparent)",
    },
    [ProductStatus.INACTIVE]: {
        bg: "rgba(209, 79, 92, 0.12)",
        color: "var(--danger)",
        border: "color-mix(in srgb, var(--danger) 28%, transparent)",
    },
    [ProductStatus.ARCHIVED]: {
        bg: "var(--surface-muted)",
        color: "var(--text-tertiary)",
        border: "var(--border-soft)",
    },
};

export const ProductActions = ({
    counts,
    onExport,
}: {
    counts: Record<string, number>;
    onExport: () => void;
}) => {
    return (
        <section
            className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
            style={{
                borderColor: "var(--border-soft)",
                background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                {Object.values(ProductStatus).map((status) => {
                    const style = statusStyle[status];
                    return (
                        <span
                            key={status}
                            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold"
                            style={{borderColor: style.border, background: style.bg, color: style.color}}
                        >
                            <span className="h-2 w-2 rounded-full" style={{background: style.color}}/>
                            {ProductStatusLabel[status]}: {counts[status] ?? 0}
                        </span>
                    );
                })}
            </div>

            <button type="button" className="btn btn-sm btn-success" onClick={onExport}>
                <i className="fa fa-file-excel"/>
                Exportar
            </button>
        </section>
    );
};
