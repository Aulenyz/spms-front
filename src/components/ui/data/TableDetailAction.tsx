import {Link, To} from "react-router-dom";
import clsx from "clsx";

export const TableDetailAction = ({
                                      to,
                                      state,
                                      disabled = false,
                                  }: {
    to?: To;
    state?: unknown;
    disabled?: boolean;
}) => {
    const className = clsx("table-link whitespace-nowrap", disabled && "pointer-events-none opacity-50");
    const content = (
        <>
            Detalles
            <i className="fa fa-chevron-right text-2xs"/>
        </>
    );

    if (!to || disabled) {
        return (
            <button type="button" className={className} disabled>
                {content}
            </button>
        );
    }

    return (
        <Link to={to} state={state} className={className}>
            {content}
        </Link>
    );
};
