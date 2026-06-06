import { BulkValidationResult, BulkValidationItem } from "../../../domain/student/BulkValidation";

interface Props {
    result: BulkValidationResult;
    validatedAt: Date;
}

export const ValidationConsole = ({ result }: Props) => {
    const { totalRows, summary, errors, warnings } = result;
    const rows: BulkValidationItem[] = [...errors, ...warnings];

    // Detectamos si el archivo está 100% limpio (sin errores ni advertencias)
    const isClean = summary.errors === 0 && summary.warnings === 0;



    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white shadow-sm">
                        <i className="fa fa-terminal text-slate-600 text-xs" />
                    </div>
                    <span className="text-base font-semibold text-slate-800 tracking-tight">Consola de validación</span>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Errores */}
                    <span className="inline-flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100">
                        <i className="fa fa-times-circle text-base text-red-500" />
                        Errores: <span className="font-semibold">{summary.errors}</span>
                    </span>
                    {/* Advertencias */}
                    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-50/60 px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-100">
                        <i className="fa fa-exclamation-triangle text-base text-amber-500" />
                        Advertencias: <span className="font-semibold">{summary.warnings}</span>
                    </span>
                    {/* Correctos */}
                    <span className="inline-flex items-center gap-2 rounded-lg bg-green-50/60 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-100">
                        <i className="fa fa-check-circle text-base text-green-500" />
                        Correctos: <span className="font-semibold">{summary.valid}</span>
                    </span>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL: CONDICIONAL SEGÚN ESTADO */}
            {isClean ? (
                /* ESTADO VACÍO / ÉXITO (ARCHIVO LIMPIO) */
                <div className="flex flex-col items-center justify-center text-center rounded-xl border border-slate-200/70 bg-slate-50/30 py-12 px-4 shadow-2xs">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 mb-3">
                        <i className="fa fa-check-circle text-4xl text-green-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-1">¡Todo listo!</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        El archivo fue validado correctamente y no contiene inconsistencias.
                    </p>
                </div>
            ) : (
                /* TABLA CON ALTO FIJO Y SCROLL VERTICAL */
                <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-2xs">
                    <div className="overflow-y-auto max-h-[350px] overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                            {/* Header estático gracias al scroll del contenedor */}
                            <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(226,232,240,0.8)]">
                                <tr className="text-xs font-medium text-slate-500">
                                    <th className="p-3 font-semibold text-slate-500 w-14 text-center bg-white">Tipo</th>
                                    <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-[40%] bg-white">Mensaje</th>
                                    <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-[20%] bg-white">Columna</th>
                                    <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-16 text-center bg-white">Fila</th>
                                    <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-[30%] bg-white">Valor encontrado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/40 transition-colors duration-100">
                                        {/* Tipo */}
                                        <td className="p-3 text-center vertical-middle">
                                            {item.type === 'ERROR' ? (
                                                <i className="fa fa-times-circle text-red-500 text-lg" />
                                            ) : (
                                                <i className="fa fa-exclamation-triangle text-amber-500 text-base" />
                                            )}
                                        </td>
                                        {/* Mensaje */}
                                        <td className={`p-3 border-l border-slate-100/70 text-sm font-normal break-words ${
                                            item.type === 'ERROR' ? 'text-red-600/90' : 'text-amber-600/90'
                                        }`}>
                                            {item.message}
                                        </td>
                                        {/* Columna */}
                                        <td className="p-3 border-l border-slate-100/70 text-sm text-slate-700 font-normal truncate">
                                            {item.column}
                                        </td>
                                        {/* Fila */}
                                        <td className="p-3 border-l border-slate-100/70 text-sm text-slate-600 text-center font-normal">
                                            {item.row}
                                        </td>
                                        {/* Valor Encontrado */}
                                        <td className="p-3 border-l border-slate-100/70 text-sm text-slate-700 font-normal break-all">
                                            {item.foundValue || <span className="text-slate-400 italic">(vacío)</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="flex items-center justify-between pt-4 text-xs text-slate-400 font-normal">
                <span>
                    Total de filas en el archivo: <span className="text-slate-600">{totalRows}</span>
                </span>

            </div>
        </div>
    );
};