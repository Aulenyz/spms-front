import {useEffect, useRef, useState} from "react";

export type ExportOption = {
    label: string;
    description?: string;
    icon: string;
    onSelect: () => void | Promise<unknown>;
};

/**
 * Botón "Exportar" que abre una lista con los formatos disponibles (imagen, PDF...). Mientras la opción elegida
 * se descarga, su ícono gira y el resto queda bloqueado; al terminar el panel se cierra.
 */
export const ExportMenu = ({options, label = "Exportar"}: {options: ExportOption[]; label?: string}) => {
    const [open, setOpen] = useState(false);
    const [running, setRunning] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    const select = async (option: ExportOption) => {
        setRunning(option.label);
        try {
            await option.onSelect();
        } finally {
            setRunning(null);
            setOpen(false);
        }
    };

    return (
        <div className="relative flex-shrink-0" ref={ref}>
            <button type="button" className="btn btn-sm" aria-haspopup="menu" aria-expanded={open} disabled={running !== null}
                    onClick={() => setOpen((current) => !current)}>
                <i className={running ? "fa fa-spinner fa-spin" : "fa fa-download"}/>{label}
                <i className={`fa fa-chevron-${open ? "up" : "down"} ms-1 text-[10px]`}/>
            </button>
            {open && (
                <div className="floating-panel right-0 top-full z-20 mt-2 w-72" role="menu">
                    <div className="floating-panel-header">Exportar como</div>
                    <div className="space-y-1 p-2">
                        {options.map((option) => (
                            <button key={option.label} type="button" role="menuitem" className="profile-menu-item w-full"
                                    disabled={running !== null} onClick={() => void select(option)}>
                                <i className={`fa ${running === option.label ? "fa-spinner fa-spin" : option.icon} w-5 text-center text-[var(--accent)]`}/>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold" style={{color: "var(--text-primary)"}}>{option.label}</span>
                                    {option.description && <span className="block text-xs" style={{color: "var(--text-secondary)"}}>{option.description}</span>}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
