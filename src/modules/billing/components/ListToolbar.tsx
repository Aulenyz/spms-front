import {ReactNode} from "react";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {SelectOption} from "../../../components/io/output/Select.tsx";

/** Filtro desplegable con el mismo diseño de Estudiantes. */
export const FilterDropdown = <T extends string, >({text, value, options, onChange, wide}: {
    text: string;
    value: T;
    options: {value: T; description: string}[];
    onChange: (value: T) => void;
    /** Para opciones con textos largos. */
    wide?: boolean;
}) => (
    <div className={wide ? "w-full sm:w-[190px]" : "w-full sm:w-[140px]"}>
        <DropdownSelect text={text} hasError={false} options={options as SelectOption[]} value={value}
                        onSelect={(selected) => onChange((selected ?? "") as T)} className="w-full"/>
    </div>
);

/** Filtros de las listas de Finanzas: desplegables y búsqueda, como en Estudiantes. */
export const ListToolbar = ({term, onTerm, placeholder, children}: {
    term: string;
    onTerm: (value: string) => void;
    placeholder: string;
    children?: ReactNode;
}) => (
    <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
        {children}
        <label className="input input-sm w-full sm:w-56">
            <i className="fa fa-search me-1"/>
            <input type="text" value={term} placeholder={placeholder} aria-label={placeholder}
                   onChange={(event) => onTerm(event.target.value)}/>
        </label>
    </form>
);
