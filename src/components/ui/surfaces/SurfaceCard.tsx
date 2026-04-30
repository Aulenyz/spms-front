import {ReactNode} from "react";
import clsx from "clsx";

type SurfaceCardProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

export const SurfaceCard = ({
    title,
    description,
    actions,
    children,
    className,
    contentClassName,
}: SurfaceCardProps) => {
    return (
        <section className={clsx("surface-card", className)}>
            {(title || description || actions) && (
                <header className="surface-card-header">
                    <div className="space-y-1">
                        {title && <h2 className="surface-card-title">{title}</h2>}
                        {description && <p className="surface-card-description">{description}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
                </header>
            )}
            <div className={clsx("surface-card-content", contentClassName)}>{children}</div>
        </section>
    );
};
