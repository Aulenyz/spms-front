import {ReactNode} from "react";

/** Barra de filtros de las listas de Finanzas: búsqueda y controles en una sola fila. */
export const ListToolbar = ({term, onTerm, placeholder, children}: {
    term: string;
    onTerm: (value: string) => void;
    placeholder: string;
    children?: ReactNode;
}) => (
    <div className="flex flex-wrap items-center gap-2 [&_select]:h-8 [&_select]:min-h-8 [&_select]:w-auto [&_select]:py-0 [&_select]:text-sm">
        <label className="flex h-8 w-full items-center gap-2 rounded-[10px] border px-3 sm:w-56"
               style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
            <i className="fa fa-search text-[11px]" style={{color: "var(--text-tertiary)"}}/>
            <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none" value={term}
                   onChange={(event) => onTerm(event.target.value)} placeholder={placeholder} aria-label={placeholder}/>
        </label>
        {children}
    </div>
);
