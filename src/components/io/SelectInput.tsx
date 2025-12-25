import clsx from "clsx";
import { Optional } from "../../domain/types/steoreotype";
import {ForwardedRef, forwardRef, ForwardRefExoticComponent, PropsWithoutRef, ReactNode} from "react";

export interface SelectInputParams
    extends PropsWithoutRef<JSX.IntrinsicElements["select"]> {
    label: Optional<string>;
    error: Optional<string>;
    className?: string;
    children: ReactNode;
}

const SelectInputRender = ({ error, label, children, ...props }: SelectInputParams, ref: ForwardedRef<HTMLSelectElement>) => {
    const labelClassName = clsx("form-label text-md mb-1", {
        "text-red-500": Boolean(error),
    });

    return (
        <div className={clsx("relative", props.className)}>
            {label && (
                <div className="relative w-fit">
                    <label className={labelClassName}>
                        {label}
                        {props.required && (
                            <small className="text-4xs absolute -right-2">
                                <i className="fa fa-asterisk" />
                            </small>
                        )}
                    </label>
                </div>
            )}

            <select ref={ref}{...props} className={clsx("input bg-transparent", {"border-red-500": Boolean(error),})}>
                {children}
            </select>
            {error && (
                <p className="text-red-500 text-xs absolute right-0">
                    <i className="fa fa-warning mr-1" />
                    {error}
                </p>
            )}
        </div>
    );
};

export const SelectInput: ForwardRefExoticComponent<SelectInputParams> =
    forwardRef(SelectInputRender);
