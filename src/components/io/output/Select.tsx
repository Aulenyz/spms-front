import {ForwardedRef, forwardRef, ForwardRefExoticComponent, JSX, PropsWithoutRef} from 'react';
import clsx from "clsx";
import {Optional} from "../../../domain/types/steoreotype.ts";

export type SelectOption = { value: string, description: string };

export interface SelectParams extends PropsWithoutRef<JSX.IntrinsicElements["select"]> {
    label?: Optional<string>;
    options: Array<SelectOption>;
}

const selectRenderer = ({label, options, ...props}: SelectParams, ref: ForwardedRef<HTMLSelectElement>) => {
    return (
        <div>
            {label && <label htmlFor="email" className="form-label">{label}</label>}
            <div>
                <select ref={ref} {...props} className={clsx(props.className, 'select')}>
                    {options.map(({value, description}: SelectOption, index: number) => {
                        return (
                            <option key={index} value={value}>{description}</option>
                        )
                    })}
                </select>
            </div>
        </div>
    );
}

export const Select: ForwardRefExoticComponent<SelectParams> = forwardRef(selectRenderer);
