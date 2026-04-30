import clsx from "clsx";
import {Page, Pageable} from "../../../domain/filters/Page.ts";

export type PagerParams = {
    page: Page<unknown>;
    onChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    showSummary?: boolean;
    compact?: boolean;
    className?: string;
    paginationClassName?: string;
};

export const Pager = ({
    page,
    onChange,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20],
    showSummary = true,
    compact = false,
    className,
    paginationClassName,
}: PagerParams) => {
    const pageable: Pageable = page.page ?? new Pageable();
    const {
        number: currentPage,
        totalPages,
        size: pageSize,
        totalElements,
    }: Pageable = pageable;

    const hasRecords: boolean = totalElements > 0 && page.content.length > 0;
    const start: number = hasRecords ? currentPage * pageSize + 1 : 0;
    const end: number = hasRecords ? Math.min(start + page.content.length - 1, totalElements) : 0;
    const isFirst: boolean = currentPage === 0;
    const isLast: boolean = totalPages <= 1 || currentPage + 1 >= totalPages;

    const pageNumbers: Array<number> = [];
    const maxVisiblePages: number = compact ? 3 : 5;
    const startPage: number = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage: number = Math.min(totalPages, startPage + maxVisiblePages);

    for (let i = startPage; i < endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className={clsx("pager", {"pager-compact": compact}, className)}>
            <div className="pager-meta">
                {showSummary && !compact && (
                    <div className="pager-summary">
                        Mostrando <strong>{page.content.length}</strong> de <strong>{totalElements}</strong> registros
                    </div>
                )}

                {!compact && onPageSizeChange && (
                    <label className="pager-size-control">
                        <span>Ver</span>
                        <select
                            className="select select-sm pager-size-select"
                            value={pageSize}
                            onChange={(event) => onPageSizeChange(Number(event.target.value))}
                        >
                            {pageSizeOptions.map((sizeOption) => (
                                <option key={sizeOption} value={sizeOption}>
                                    {sizeOption}
                                </option>
                            ))}
                        </select>
                        <span>por pagina</span>
                    </label>
                )}
            </div>

            <div className={clsx("pager-controls", paginationClassName)}>
                <span data-datatable-info="true" className="pager-range">
                    {start} - {end} de {totalElements}
                </span>

                <div className="pager-nav" data-datatable-pagination="true">
                    <button
                        type="button"
                        className="pager-button"
                        onClick={() => !isFirst && onChange(0)}
                        disabled={isFirst}
                    >
                        <i className="fa fa-angle-double-left !text-2xs"/>
                    </button>

                    <button
                        type="button"
                        className="pager-button"
                        onClick={() => !isFirst && onChange(currentPage - 1)}
                        disabled={isFirst}
                    >
                        <i className="fa fa-angle-left !text-2xs"/>
                    </button>

                    {pageNumbers.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            type="button"
                            className={clsx("pager-button", {
                                "pager-button-active": pageNumber === currentPage,
                            })}
                            onClick={() => onChange(pageNumber)}
                        >
                            {pageNumber + 1}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="pager-button"
                        onClick={() => !isLast && onChange(currentPage + 1)}
                        disabled={isLast}
                    >
                        <i className="fa fa-angle-right !text-2xs"/>
                    </button>

                    <button
                        type="button"
                        className="pager-button"
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
