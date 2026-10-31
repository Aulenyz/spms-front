import {ReactNode} from "react";

/** Barra de filtros de las listas de Finanzas: búsqueda y controles adicionales. */
export const ListToolbar = ({term, onTerm, placeholder, children}: {
    term: string;
    onTerm: (value: string) => void;
    placeholder: string;
    children?: ReactNode;
}) => (
    <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-[10px] border px-3"
               style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
            <i className="fa fa-search text-[11px]" style={{color: "var(--text-tertiary)"}}/>
            <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none" value={term}
                   onChange={(event) => onTerm(event.target.value)} placeholder={placeholder} aria-label={placeholder}/>
        </label>
        {children}
    </div>
);
