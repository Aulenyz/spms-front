import clsx from "clsx";
import {Page, Pageable} from "../../../domain/filters/Page.ts";

export type PagerParams = {
    page: Page<unknown>;
    onChange: (page: number) => void;
    showSummary?: boolean;
    compact?: boolean;
};

export const Pager = ({page, onChange, showSummary = true, compact = false,}: PagerParams) => {
    const pageable: Pageable = page.page ?? new Pageable();
    const {
        number: currentPage,
        totalPages,
        size: pageSize,
        totalElements,
    }: Pageable = pageable;

    const start: number = currentPage * pageSize + 1;
    const end: number = Math.min(start + page.content.length - 1, totalElements);
    const isFirst: boolean = currentPage === 0;
    const isLast: boolean = currentPage + 1 === totalPages;

    const pageNumbers: Array<number> = [];
    const maxVisiblePages: number = 4;
    const startPage: number = Math.max(
        0,
        currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage: number = Math.min(totalPages, startPage + maxVisiblePages);

    for (let i = startPage; i < endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className={clsx(
            "card-footer flex flex-col md:flex-row justify-center md:justify-between text-gray-600 font-medium",
            compact ? "gap-2 text-[11px]" : "gap-5 text-2sm"
        )}>

            {showSummary && !compact && (
                <div className="flex items-center gap-2 order-2 md:order-1">
                    Mostrando {page.content.length} de {totalElements} elementos encontrados
                </div>
            )}

            <div
                className={clsx(
                    "flex items-center order-1 md:order-2",
                    compact ? "gap-2" : "gap-4"
                )}>

                <span
                    data-datatable-info="true"
                    className={clsx(compact ? "text-xs" : "text-sm")}>
                    {start} - {end} de {totalElements}
                </span>

                <div
                    className={clsx("pagination flex items-center",
                        compact ? "space-x-1" : "space-x-2"
                    )}
                    data-datatable-pagination="true">

                    <button className={clsx("btn", compact ? "px-1.5 py-0.5 text-xs" : "",
                        {disabled: isFirst}
                    )}
                            onClick={() => !isFirst && onChange(0)}
                            disabled={isFirst}>
                        <i className="fa fa-angle-double-left !text-2xs"/>
                    </button>

                    <button
                        className={clsx("btn", compact ? "px-1.5 py-0.5 text-xs" : "",
                            {disabled: isFirst}
                        )}
                        onClick={() => !isFirst && onChange(currentPage - 1)}
                        disabled={isFirst}
                    >
                        <i className="fa fa-angle-left !text-2xs"/>
                    </button>

                    {pageNumbers.map((pageNumber) => (
                        <button key={pageNumber} className={clsx("btn",
                            compact ? "px-1.5 py-0.5 text-xs" : "",
                            {active: pageNumber === currentPage}
                        )}
                                onClick={() => onChange(pageNumber)}
                        >
                            {pageNumber + 1}
                        </button>
                    ))}

                    <button
                        className={clsx("btn", compact ? "px-1.5 py-0.5 text-xs" : "",
                            {disabled: isLast}
                        )}
                        onClick={() => !isLast && onChange(currentPage + 1)}
                        disabled={isLast}
                    >
                        <i className="fa fa-angle-right !text-2xs"/>
                    </button>

                    <button
                        className={clsx("btn", compact ? "px-1.5 py-0.5 text-xs" : "",
                            {disabled: isLast}
                        )}
                        onClick={() => !isLast && onChange(totalPages - 1)}
                        disabled={isLast}
                    >
                        <i className="fa fa-angle-double-right !text-2xs"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
