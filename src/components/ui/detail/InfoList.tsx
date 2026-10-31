import {ReactNode} from "react";

export type InfoItem = { label: string; value?: ReactNode; full?: boolean };

/** Pares etiqueta / valor. Los valores vacíos se muestran como un guion. */
export const InfoList = ({items, columns = 2}: { items: InfoItem[]; columns?: 1 | 2 | 3 }) => (
    <dl className={`info-list info-list-${columns}`}>
        {items.map((item) => (
            <div key={item.label} className={item.full ? "info-item info-item-full" : "info-item"}>
                <dt>{item.label}</dt>
                <dd>{item.value === undefined || item.value === null || item.value === "" ? "—" : item.value}</dd>
            </div>
        ))}
    </dl>
);
