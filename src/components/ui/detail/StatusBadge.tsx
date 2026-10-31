import {ReactNode} from "react";

type StatusBadgeProps = { active?: boolean; activeLabel?: string; inactiveLabel?: string };

export const StatusBadge = ({active, activeLabel = "Activo", inactiveLabel = "Inactivo"}: StatusBadgeProps) => (
    <span className={active ? "detail-badge detail-badge-success" : "detail-badge detail-badge-muted"}>
        <span className="detail-badge-dot"/>{active ? activeLabel : inactiveLabel}
    </span>
);

export const Badge = ({children}: { children: ReactNode }) => <span className="detail-badge">{children}</span>;
