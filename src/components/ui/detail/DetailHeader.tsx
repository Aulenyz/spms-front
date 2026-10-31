import {ReactNode} from "react";
import {Link} from "react-router-dom";

type DetailHeaderProps = {
    /** Texto corto para el avatar (iniciales) o un ícono de Font Awesome (`fa-...`). */
    avatar?: string;
    image?: string | null;
    title: string;
    subtitle?: ReactNode;
    /** Estado y etiquetas cortas; no repetir aquí datos que ya están en el título o el subtítulo. */
    badges?: ReactNode;
    actions?: ReactNode;
    backTo?: string;
    backLabel?: string;
};

export const initialsOf = (value?: string | null) =>
    (value ?? "").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

/** Encabezado de las páginas de detalle: identidad del registro, estado y acciones principales. */
export const DetailHeader = ({avatar, image, title, subtitle, badges, actions, backTo, backLabel}: DetailHeaderProps) => (
    <section className="detail-header">
        <div className="flex min-w-0 items-center gap-4">
            {image
                ? <img src={image} alt="" className="detail-avatar object-cover"/>
                : <span className="detail-avatar" aria-hidden="true">
                    {avatar?.startsWith("fa-") ? <i className={`fa ${avatar}`}/> : initialsOf(avatar ?? title)}
                </span>}
            <div className="min-w-0 space-y-1">
                {backTo && <Link to={backTo} className="detail-back"><i className="fa fa-arrow-left"/>{backLabel ?? "Volver"}</Link>}
                <h1 className="detail-title">{title}</h1>
                {subtitle && <p className="detail-subtitle">{subtitle}</p>}
                {badges && <div className="flex flex-wrap items-center gap-2 pt-1">{badges}</div>}
            </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </section>
);
