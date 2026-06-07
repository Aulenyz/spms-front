import {ProductStatus, ProductStatusLabel} from "../../../domain/model/product/Product.ts";

export const ProductStatusPill = ({status}: {status: ProductStatus}) => {
    const style = status === ProductStatus.ACTIVE
        ? {background: "var(--success-soft)", color: "var(--success)"}
        : status === ProductStatus.INACTIVE
            ? {background: "rgba(209, 79, 92, 0.12)", color: "var(--danger)"}
            : {background: "var(--surface-muted)", color: "var(--text-tertiary)"};

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={style}>
            <span className="h-1.5 w-1.5 rounded-full" style={{background: "currentColor"}}/>
            {ProductStatusLabel[status]}
        </span>
    );
};
