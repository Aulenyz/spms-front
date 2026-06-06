import {ProductCategory} from "../../../domain/model/product/ProductCategory.ts";
import {Tooltip} from "../../../components/shared/Tooltip.tsx";

export const ProductCategoryCard = ({
    category,
    onEdit,
}: {
    category: ProductCategory;
    onEdit: (category: ProductCategory) => void;
}) => {
    return (
        <article
            className="relative z-0 flex min-h-[220px] flex-col overflow-visible rounded-[24px] border transition-all duration-200 hover:z-20 hover:-translate-y-1"
            style={{
                borderColor: category.isSystem
                    ? "color-mix(in srgb, var(--warning) 28%, var(--border-soft))"
                    : "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <span
                className="absolute right-4 top-4 z-10 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--surface)]"
                style={{background: category.active ? "var(--success)" : "var(--danger)"}}
                title={category.active ? "Categoría activa" : "Categoría inactiva"}
            />

            <div
                className="absolute left-0 top-0 h-full w-1.5 rounded-l-[24px]"
                style={{
                    background: category.isSystem
                        ? "linear-gradient(180deg, var(--warning), color-mix(in srgb, var(--warning) 55%, white))"
                        : category.active
                            ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 65%, white))"
                            : "linear-gradient(180deg, color-mix(in srgb, var(--text-tertiary) 80%, white), var(--muted))",
                }}
            />

            <div className="flex flex-1 flex-col gap-5 p-5 pl-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-base"
                            style={{
                                background: category.isSystem ? "var(--warning-soft)" : "var(--accent-soft)",
                                color: category.isSystem ? "var(--warning)" : "var(--accent)",
                                boxShadow: "inset 0 0 0 1px var(--border-soft)",
                            }}
                        >
                            <i className={`fa ${category.isSystem ? "fa-lock" : "fa-folder-open"}`}/>
                        </span>

                        <div className="min-w-0">
                            <h3 className="break-words text-base font-semibold leading-6" style={{color: "var(--text-primary)"}}>
                                {category.name}
                            </h3>
                            <span className="mt-1 block break-all text-[11px] font-bold uppercase tracking-[0.14em]" style={{color: "var(--text-tertiary)"}}>
                                {category.code || "Sin código"}
                            </span>
                        </div>
                    </div>

                    <Tooltip
                        placement="top"
                        className="mr-5 shrink-0"
                        message={category.isSystem
                            ? "Esta categoría pertenece al sistema y no se puede editar."
                            : "Editar categoría"}
                    >
                        <button
                            type="button"
                            className="icon-button h-9 w-9"
                            disabled={category.isSystem}
                            onClick={() => onEdit(category)}
                            style={category.isSystem ? {opacity: 0.28, cursor: "not-allowed", filter: "grayscale(1)"} : undefined}
                        >
                            <i className="fa fa-pen text-xs"/>
                        </button>
                    </Tooltip>
                </div>

                <p className="break-words text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                    {category.description || "Sin descripción registrada para esta categoría."}
                </p>
            </div>
        </article>
    );
};
