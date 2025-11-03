import {ForwardedRef, forwardRef, ForwardRefExoticComponent, JSX, PropsWithoutRef} from 'react';
import clsx from "clsx";
import {Optional} from "../../domain/types/steoreotype.ts";

export interface InputParams extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
    isPassword?: boolean;
    className?: string;
    label: Optional<string>;
    error: Optional<string>
}

export interface SimpleInputParams extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
    error?: boolean;
}

const InputRender = ({error, label, isPassword, ...props}: InputParams, ref: ForwardedRef<HTMLInputElement>) => {
    const labelClassName: string = clsx('form-label text-md mb-1', {
        'text-red-500': Boolean(error),
    });

    return (
        <div className={clsx('relative', props.className)}>
            {label && (
                <div className="relative w-fit">
                    <label htmlFor="email" className={labelClassName}>
                        {label}
                        {props.required && <small className="text-4xs absolute -right-2">
                            <i className="fa fa-asterisk"/>
                        </small>}
                    </label>
                </div>
            )}
            <input ref={ref} autoComplete={isPassword ? 'new-password' : 'off'} {...props}
                   required={false} className={clsx('input bg-transparent', {
                'border-red-500': Boolean(error)
            })}/>

            {error &&
                (
                    <p className="text-red-500 text-xs absolute right-0">
                        <i className="fa fa-warning mr-1"/>
                        {error}
                    </p>
                )
            }
        </div>
    );
}

export const Input: ForwardRefExoticComponent<InputParams> = forwardRef(InputRender);

const SimpleInputRender = ({error, ...props}: SimpleInputParams, ref: ForwardedRef<HTMLInputElement>) => {
    return (
        <input ref={ref} autoComplete="off" {...props}
               className={clsx(props.className, 'form-control bg-transparent', {'is-invalid': Boolean(error)})}/>
    );
}

export const SimpleInput: ForwardRefExoticComponent<SimpleInputParams> = forwardRef(SimpleInputRender);
