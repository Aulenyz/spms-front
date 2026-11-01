import {useEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import {toast} from "react-toastify";
import {downloadFile} from "../../../utils/Files.ts";
import {localToday} from "../../../domain/billing/Invoice.ts";

/** Rango de fechas de una exportación (yyyy-mm-dd). */
export type ExportRange = {from: string; to: string};

/** Lo más largo que se exporta de una vez; el servidor aplica el mismo límite. */
export const MAX_EXPORT_MONTHS = 3;

const shiftMonths = (date: string, months: number) => {
    const [year, month, day] = date.split("-").map(Number);
    const target = new Date(year, month - 1 + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, lastDay));
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
};

const rangeProblem = ({from, to}: ExportRange) => {
    if (!from || !to) return "Indica las dos fechas.";
    if (to < from) return "La fecha final debe ser igual o posterior a la inicial.";
    if (to > shiftMonths(from, MAX_EXPORT_MONTHS)) return `Máximo ${MAX_EXPORT_MONTHS} meses por exportación.`;
    return null;
};

/**
 * Botón "Exportar" de cualquier listado: pide al servidor el Excel con todos los registros del filtro
 * (no solo la página visible) y lo descarga. Con `dateRange` abre un panel para elegir desde y hasta
 * (máximo 3 meses) antes de descargar. Todas las listas lo usan para verse y comportarse igual.
 */
export const ExportExcelButton = ({fetchFile, fileName, label = "Exportar", disabled, dateRange = false}: {
    /** Trae el .xlsx del servidor; con `dateRange` recibe el rango elegido. */
    fetchFile: (range?: ExportRange) => Promise<Blob>;
    fileName: string;
    label?: string;
    disabled?: boolean;
    dateRange?: boolean;
}) => {
    const [exporting, setExporting] = useState(false);
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState<ExportRange>(() => ({from: shiftMonths(localToday(), -1), to: localToday()}));
    const ref = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    // El panel flota sobre la página (no lo recortan las tarjetas), debajo del botón
    const [position, setPosition] = useState<{top: number; left: number} | null>(null);
    const PANEL_WIDTH = 320;
    const problem = dateRange ? rangeProblem(range) : null;

    useEffect(() => {
        if (!open) return;
        const place = () => {
            const rect = ref.current?.getBoundingClientRect();
            // Se abre hacia la derecha del botón; si no cabe, se corre hacia la izquierda
            if (rect) setPosition({top: rect.bottom + 8, left: Math.max(8, Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 8))});
        };
        const handler = (event: MouseEvent) => {
            const target = event.target as Node;
            if (!ref.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
        };
        place();
        document.addEventListener("mousedown", handler);
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            document.removeEventListener("mousedown", handler);
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open]);

    const run = async () => {
        if (problem) return;
        setExporting(true);
        try {
            const blob = await fetchFile(dateRange ? range : undefined);
            const name = dateRange ? `${fileName}-${range.from}-a-${range.to}` : fileName;
            downloadFile(blob, name.endsWith(".xlsx") ? name : `${name}.xlsx`);
            setOpen(false);
        } catch (error) {
            toast.error((error as {message?: string})?.message || "No se pudo exportar el listado.");
        } finally {
            setExporting(false);
        }
    };

    const button = (
        <button type="button" className="btn btn-sm" disabled={disabled || exporting} title="Descargar en Excel"
                aria-expanded={dateRange ? open : undefined}
                onClick={() => dateRange ? setOpen((current) => !current) : void run()}>
            <i className={`fa ${exporting ? "fa-spinner fa-spin" : "fa-file-excel"}`}/>
            {label}
        </button>
    );
    if (!dateRange) return button;

    return (
        <div className="relative" ref={ref}>
            {button}
            {open && position && ReactDOM.createPortal(
                <div ref={panelRef} className="floating-panel fixed z-[10000]" style={{top: position.top, left: position.left, width: PANEL_WIDTH}}>
                    <div className="floating-panel-header">Exportar a Excel</div>
                    <div className="space-y-3 p-3">
                        <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Desde</span>
                                <input type="date" className="input input-sm w-full" value={range.from} max={range.to}
                                       onChange={(event) => setRange((current) => ({...current, from: event.target.value}))}/>
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Hasta</span>
                                <input type="date" className="input input-sm w-full" value={range.to} min={range.from}
                                       onChange={(event) => setRange((current) => ({...current, to: event.target.value}))}/>
                            </label>
                        </div>
                        <p className="text-xs" style={{color: problem ? "var(--danger)" : "var(--text-tertiary)"}}>
                            {problem ?? `Hasta ${MAX_EXPORT_MONTHS} meses por exportación, con los filtros de la lista.`}
                        </p>
                        <button type="button" className="btn btn-sm btn-primary w-full" disabled={Boolean(problem) || exporting}
                                onClick={() => void run()}>
                            <i className={`fa ${exporting ? "fa-spinner fa-spin" : "fa-download"}`}/>Descargar
                        </button>
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
};
