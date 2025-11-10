import React, {ChangeEvent} from "react";
import {Control, useController} from "react-hook-form";

interface ToggleSwitchProps {
    name: string;
    control: Control<any>;
    label?: string;
    rules?: object;
}

export const Checkbox: React.FC<ToggleSwitchProps> = ({name, control, label}) => {

    const {field: {value, onChange, ref}} = useController({name, control});

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked);

    return (
        <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={value} onChange={handleCheckboxChange} className="sr-only peer" ref={ref}/>
            <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700
                  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                   peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5
                    after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full
                     after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"/>
            {label && <span className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
        </label>
    );
};

export type SimpleCheckboxParams = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const SimpleCheckbox = ({label, checked, onChange}: SimpleCheckboxParams) => {

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked);

    return (
        <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={handleCheckboxChange} className="sr-only peer"/>
            <div className="relative w-10 h-5 bg-gray-200 peer-focus:outline-none
                 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700
                  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                   peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5
                    after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full
                     after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"/>
            {label && <span className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{label}</span>}
        </label>
    );
};
