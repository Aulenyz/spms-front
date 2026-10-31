import {useLocation} from "react-router-dom";
import {resolveRouteModule} from "../../../app/navigation/menu.ts";
import {ReactNode} from "react";
import clsx from "clsx";

type PageHeaderProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
};

export const PageHeader = ({eyebrow, title, description, actions, className}: PageHeaderProps) => {
    const {pathname} = useLocation();
    const module = resolveRouteModule(pathname);
    return (
        <section className={clsx("page-header", className)}>
            <div className="flex items-start gap-4">
                <span className="page-header-icon" aria-hidden="true">
                    <i className={`fa ${module.icon}`}/>
                </span>
                <div className="space-y-2">
                    {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
                    <div className="space-y-1">
                        <h1 className="page-title">{title}</h1>
                        {description && <p className="page-description">{description}</p>}
                    </div>
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </section>
    );
};
