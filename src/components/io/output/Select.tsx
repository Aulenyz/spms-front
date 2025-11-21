import {ForwardedRef, forwardRef, ForwardRefExoticComponent, JSX, PropsWithoutRef} from 'react';
import clsx from 'clsx';
import {Optional, PlainValue} from "../../../domain/types/steoreotype.ts";

// Usamos PlainValue como tipo para value en SelectOption, pero asegurémonos de que se maneje correctamente
export type SelectOption = { value: PlainValue, description: string };

// Ajustamos SelectParams para que acepte SelectOption como tipo para options
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
                        // Aseguramos que el valor que se pasa en <option> sea siempre una cadena
                        const valueString = String(value); // Asegurarse de que el value sea un string
                        return (
                            <option key={index} value={valueString}>
                                {description}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>
    );
};

// Exportamos el componente Select utilizando forwardRef
export const Select: ForwardRefExoticComponent<SelectParams> = forwardRef(selectRenderer);
