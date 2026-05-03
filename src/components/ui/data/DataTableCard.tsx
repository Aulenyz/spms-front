import {ReactNode} from "react";
import clsx from "clsx";

type DataTableCardProps = {
    title: string;
    description?: string;
    status?: ReactNode;
    actions?: ReactNode;
    filters?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
};

export const DataTableCard = ({
    title,
    description,
    status,
    actions,
    filters,
    children,
    footer,
    className,
}: DataTableCardProps) => {
    return (
        <section className={clsx("data-table-card", className)}>
            <header className="data-table-card-header">
                <div className="w-full space-y-2">
                    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="surface-card-title">{title}</h2>
                                {status}
                            </div>
                            {description && <p className="surface-card-description">{description}</p>}
                        </div>

                        {(actions || filters) && (
                            <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
                                {actions && <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">{actions}</div>}
                                {filters && <div className="w-full lg:w-auto">{filters}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <div className="data-table-card-body">{children}</div>
            {footer && <div className="data-table-card-footer">{footer}</div>}
        </section>
    );
};
