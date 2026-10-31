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
    /** "row": filters on their own line under the title, in one row. Default: beside the title. */
    filtersLayout?: "side" | "row";
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
    filtersLayout = "side",
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

                        {(actions || (filters && filtersLayout === "side")) && (
                            <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
                                {actions && <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">{actions}</div>}
                                {filters && filtersLayout === "side" && <div className="w-full lg:w-auto">{filters}</div>}
                            </div>
                        )}
                    </div>
                    {filters && filtersLayout === "row" && <div className="pt-2">{filters}</div>}
                </div>
            </header>
            <div className="data-table-card-body">{children}</div>
            {footer && <div className="data-table-card-footer">{footer}</div>}
        </section>
    );
};
