import {Optional} from "../../../domain/types/steoreotype.ts";
import clsx from "clsx";

export const ErrorMessage = (props: { message: Optional<string>, className?: string }) => {
    return (
        props.message && (
            <div
                className={clsx(props.className, "flex items-center p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400")}>
                <i className="fa fa-warning mr-1"/>
                {props.message}
            </div>
        )
    )
}