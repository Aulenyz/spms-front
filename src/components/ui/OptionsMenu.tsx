import {useEffect, useRef, useState} from "react";

export type OptionsMenuItem = {
    label: string;
    icon: string;
    onSelect: () => void | Promise<unknown>;
    /** Se muestra solo si es verdadero (por ejemplo, según el permiso). */
    visible?: boolean;
};

/**
 * Engranaje que abre un panel con las acciones de un registro, como en Materias. Mientras una acción
 * asíncrona corre, su ícono gira; al terminar el panel se cierra.
 */
export const OptionsMenu = ({items, label = "Opciones"}: {items: OptionsMenuItem[]; label?: string}) => {
    const [open, setOpen] = useState(false);
    const [running, setRunning] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);
    const shown = items.filter((item) => item.visible !== false);

    useEffect(() => {
        if (!open) return;
        const handler = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    if (shown.length === 0) return null;

    const select = async (item: OptionsMenuItem) => {
        setRunning(item.label);
        try {
            await item.onSelect();
        } finally {
            setRunning(null);
            setOpen(false);
        }
    };

    return (
        <div className="relative flex-shrink-0" ref={ref}>
            <button type="button" className="icon-button h-9 w-9" title={label} aria-label={label} aria-expanded={open}
                    onClick={() => setOpen((current) => !current)}>
                <i className="fa fa-gear text-sm"/>
            </button>
            {open && (
                <div className="floating-panel right-0 top-full z-20 mt-2 w-64">
                    <div className="floating-panel-header">Opciones</div>
                    <div className="space-y-1 p-2">
                        {shown.map((item) => (
                            <button key={item.label} type="button" className="profile-menu-item w-full" disabled={running !== null}
                                    onClick={() => void select(item)}>
                                <i className={`fa ${running === item.label ? "fa-spinner fa-spin" : item.icon} text-[var(--accent)]`}/>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
