import {ReactNode} from "react";
import clsx from "clsx";

type DetailSectionProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    /** Sin relleno interno, para tablas que ocupan todo el ancho. */
    flush?: boolean;
    className?: string;
};

export const DetailSection = ({title, description, actions, children, flush, className}: DetailSectionProps) => (
    <section className={clsx("detail-section", className)}>
        <header className="detail-section-head">
            <div className="min-w-0">
                <h2 className="detail-section-title">{title}</h2>
                {description && <p className="detail-section-description">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
        <div className={flush ? undefined : "p-4 sm:p-5"}>{children}</div>
    </section>
);
