import clsx from "clsx";
import {Page, Pageable} from "../../../domain/filters/Page.ts";

export type PagerParams = { page: Page<unknown>; onChange: (page: number) => void };

export const Pager = ({page, onChange}: PagerParams) => {

    // Destructure and provide fallback values for `page.page`
    const pageable: Pageable = page.page ?? new Pageable();
    const {number: currentPage, totalPages, size: pageSize, totalElements}: Pageable = pageable;

    // Derived values
    const start: number = currentPage * pageSize + 1;
    const end: number = Math.min(start + page.content.length - 1, totalElements);
    const isFirst: boolean = currentPage === 0;
    const isLast: boolean = currentPage + 1 === totalPages;

    // Determine which page numbers to show (up to 4 pages)
    const pageNumbers: Array<number> = [];
    const maxVisiblePages: number = 4;
    const startPage: number = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage: number = Math.min(totalPages, startPage + maxVisiblePages);

    for (let i = startPage; i < endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div
            className="card-footer justify-center md:justify-between flex-col md:flex-row gap-5 text-gray-600 text-2sm font-medium">
            {/* Information Section */}
            <div className="flex items-center gap-2 order-2 md:order-1">
                Mostrando {page.content.length} de {totalElements} elementos encontrados
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-4 order-1 md:order-2">
                <span data-datatable-info="true">
                    {start} - {end} de {totalElements}
                </span>
                <div className="pagination" data-datatable-pagination="true">
                    {/* First Button */}
                    <button className={clsx("btn", {disabled: isFirst})}
                            onClick={() => !isFirst && onChange(0)}
                            disabled={isFirst}>
                        <i className="fa fa-angle-double-left !text-2xs"/>
                    </button>
                    {/* Previous Button */}
                    <button className={clsx("btn", {disabled: isFirst})}
                            onClick={() => !isFirst && onChange(currentPage - 1)}
                            disabled={isFirst}>
                        <i className="fa fa-angle-left !text-2xs"/>
                    </button>
                    {/* Page Buttons */}
                    {pageNumbers.map((pageNumber) => (
                        <button key={pageNumber} className={clsx("btn", {active: pageNumber === currentPage})}
                                onClick={() => onChange(pageNumber)}>
                            {pageNumber + 1}
                        </button>
                    ))}
                    {/* Next Button */}
                    <button className={clsx("btn", {disabled: isLast})}
                            onClick={() => !isLast && onChange(currentPage + 1)}
                            disabled={isLast}>
                        <i className="fa fa-angle-right !text-2xs"/>
                    </button>
                    <button className={clsx("btn", {disabled: isLast})}
                            onClick={() => !isLast && onChange(totalPages - 1)}
                            disabled={isLast}>
                        <i className="fa fa-angle-double-right !text-2xs"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
