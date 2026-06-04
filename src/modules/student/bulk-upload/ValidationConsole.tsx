import { BulkValidationResult, BulkValidationItem } from "../../../domain/student/BulkValidation";

interface Props {
    result: BulkValidationResult;
    validatedAt: Date;
}

export const ValidationConsole = ({ result, validatedAt }: Props) => {
    const { totalRows, summary, errors, warnings } = result;
    const rows: BulkValidationItem[] = [...errors, ...warnings];

    const formattedDate = validatedAt.toLocaleDateString('es-DO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const formattedTime = validatedAt.toLocaleTimeString('es-DO', {
        hour: '2-digit', minute: '2-digit', hour12: true
    }).toLowerCase();

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

            {/* CARD CONTENEDORA DE LA TABLA */}
            <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-200/70 text-xs font-medium text-slate-500 bg-white">
                                <th className="p-3 font-semibold text-slate-500 w-14 text-center">Tipo</th>
                                <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-[40%]">Mensaje</th>
                                <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-[20%]">Columna</th>
                                <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-16 text-center">Fila</th>
                                <th className="p-3 font-semibold text-slate-500 border-l border-slate-100 w-[30%]">Valor encontrado</th>
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

            {/* FOOTER */}
            <div className="flex items-center justify-between pt-4 text-xs text-slate-400 font-normal">
                <span>
                    Total de filas en el archivo: <span className="text-slate-600">{totalRows}</span>
                </span>
                <span>
                    Última validación: {formattedDate} {formattedTime}
                </span>
            </div>
        </div>
    );
};