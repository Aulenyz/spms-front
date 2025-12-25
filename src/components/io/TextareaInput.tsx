import clsx from "clsx";
import {Optional} from "../../domain/types/steoreotype";
import {ForwardedRef, forwardRef, ForwardRefExoticComponent, PropsWithoutRef} from "react";

export interface TextareaInputParams
    extends PropsWithoutRef<JSX.IntrinsicElements["textarea"]> {
    label: Optional<string>;
    error: Optional<string>;
    className?: string;
}

const TextareaInputRender = ({error, label, ...props}: TextareaInputParams, ref: ForwardedRef<HTMLTextAreaElement>) => {
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
                                <i className="fa fa-asterisk"/>
                            </small>
                        )}
                    </label>
                </div>
            )}
            <textarea
                ref={ref}
                {...props}
                rows={props.rows ?? 4}
                className={clsx("input bg-transparent resize-none py-6 leading-relaxed",
                    {
                        "border-red-500": Boolean(error),
                    })}
            />
            {error && (
                <p className="text-red-500 text-xs absolute right-0">
                    <i className="fa fa-warning mr-1"/>
                    {error}
                </p>
            )}
        </div>
    );
};

export const TextareaInput: ForwardRefExoticComponent<TextareaInputParams> =
    forwardRef(TextareaInputRender);
