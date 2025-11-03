import {ForwardedRef, forwardRef, useState} from "react";
import clsx from "clsx";
import {InputParams} from "./Input.tsx";

export const PasswordInput = forwardRef<HTMLInputElement, InputParams>(
    ({label, error, className, ...props}, ref: ForwardedRef<HTMLInputElement>) => {
        const [show, setShow] = useState(false);

        const toggleVisibility = () => setShow(prev => !prev);

        const labelClassName = clsx('form-label text-md mb-1', {
            'text-red-500': Boolean(error),
        });

        return (
            <div className={clsx("relative", className)}>
                {label && (
                    <div className="relative w-fit">
                        <label htmlFor={props.name} className={labelClassName}>
                            {label}
                            {props.required && <small className="text-4xs absolute -right-2">
                                <i className="fa fa-asterisk"/>
                            </small>}
                        </label>
                    </div>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        {...props}
                        type={show ? "text" : "password"}
                        autoComplete="new-password"
                        className={clsx("input bg-transparent pr-10", {
                            "border-red-500": Boolean(error),
                        })}
                    />
                    <button
                        type="button"
                        onClick={toggleVisibility}
                        className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out"
                        tabIndex={-1}
                    >
                        <i className={clsx("fa", show ? "fa-eye-slash" : "fa-eye", "transition-all duration-300")}/>
                    </button>
                </div>
                {error && (
                    <p className="text-red-500 text-xs absolute right-0 mt-1">
                        <i className="fa fa-warning mr-1"/>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
