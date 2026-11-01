import {useState} from "react";
import {toast} from "react-toastify";
import {downloadFile} from "../../../utils/Files.ts";

/**
 * Botón "Exportar" de cualquier listado: pide al servidor el Excel con todos los registros del filtro
 * (no solo la página visible) y lo descarga. Todas las listas lo usan para verse y comportarse igual.
 */
export const ExportExcelButton = ({fetchFile, fileName, label = "Exportar", disabled}: {
    /** Trae el .xlsx del servidor, p. ej. `() => InvoiceService.instance.exportExcel(filtros)`. */
    fetchFile: () => Promise<Blob>;
    fileName: string;
    label?: string;
    disabled?: boolean;
}) => {
    const [exporting, setExporting] = useState(false);

    const run = async () => {
        setExporting(true);
        try {
            downloadFile(await fetchFile(), fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
        } catch (error) {
            toast.error((error as {message?: string})?.message || "No se pudo exportar el listado.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <button type="button" className="btn btn-sm" disabled={disabled || exporting} onClick={() => void run()}
                title="Descargar en Excel">
            <i className={`fa ${exporting ? "fa-spinner fa-spin" : "fa-file-excel"}`}/>
            {label}
        </button>
    );
};
