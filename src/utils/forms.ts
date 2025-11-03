import {FieldValues, Path, UseFormSetValue} from 'react-hook-form';
import {isDate} from "lodash";
import {Optional, SelectOption} from "../domain/types/steoreotype.ts";

export const setValues = <T extends FieldValues>(setValue: UseFormSetValue<T | any>, values: Optional<T>) => {
    values && Object.keys(values).forEach((key: string) => {
        const value = values[key];
        if (isDate(value)) {
            setValue(key as Path<T | any>, new Date(value))
        } else {
            setValue(key as Path<T | any>, value)
        }
    });
}

export const isValidPhone = (phone?: string): boolean => {
    return phone ? /^(809|829|849)\d{7}$/.test(phone) : false;
}


export const activeOptions: Array<SelectOption> = [
    {
        description: 'Activas',
        value: true,
    },
    {
        description: 'Inactivas',
        value: false,
    },
];
