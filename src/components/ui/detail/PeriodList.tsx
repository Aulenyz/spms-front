import {ReactNode} from "react";

const DAY_MS = 86_400_000;
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const formatDate = (date: Date) => `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** "42 días · ≈ 6 semanas" */
const durationText = (days: number) =>
    days >= 14 ? `${days} días · ≈ ${Math.round(days / 7)} semanas` : `${days} ${days === 1 ? "día" : "días"}`;

type PeriodStatus = { label: string; detail: string; icon: string; color: string; background: string };

/** Dónde está hoy respecto a un período: terminado, en curso (cuánto falta) o próximo (cuándo empieza). */
const statusOf = (start: Date, end: Date, today: Date): PeriodStatus => {
    if (end < today) return {label: "Terminado", detail: "", icon: "fa-check", color: "var(--text-secondary)", background: "var(--surface)"};
    if (start <= today) {
        const left = Math.round((end.getTime() - today.getTime()) / DAY_MS);
        return {label: "En curso", detail: left === 0 ? "termina hoy" : `faltan ${left} ${left === 1 ? "día" : "días"}`,
            icon: "fa-play", color: "var(--success)", background: "var(--success-soft)"};
    }
    const wait = Math.round((start.getTime() - today.getTime()) / DAY_MS);
    return {label: "Próximo", detail: `empieza en ${wait} ${wait === 1 ? "día" : "días"}`, icon: "fa-clock", color: "var(--accent)", background: "var(--accent-soft)"};
};

export type PeriodRow = {
    key: string | number;
    code: string;
    name: string;
    /** Fechas reales; sin ellas (solo día y mes) se muestra {@code range} y no hay estado. */
    start?: Date;
    end?: Date;
    range?: string;
    days: number;
    /** Etiquetas junto al nombre (p. ej. "Con calificaciones"). */
    badges?: ReactNode;
    /** Acciones de la fila, a la derecha. */
    actions?: ReactNode;
};

/**
 * Lista de períodos de evaluación (del curso base y de cada curso): resumen, barra del año con cada período a
 * escala y una fila por período con sus fechas, cuánto dura y dónde está hoy. El ancho de la barra sale de los
 * días de cada período, así que uno extendido que se cruza con el siguiente no la desborda.
 */
export const PeriodList = ({rows, caption}: { rows: PeriodRow[]; caption?: ReactNode }) => {
    const today = startOfToday();
    const items = rows.map((row) => ({row, status: row.start && row.end ? statusOf(row.start, row.end, today) : null}));
    const total = rows.reduce((sum, row) => sum + row.days, 0);
    const dated = items.length > 0 && items.every((item) => item.status);
    const hasActions = rows.some((row) => row.actions);

    return (
        <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{color: "var(--text-secondary)"}}>
                <strong style={{color: "var(--text-primary)"}}>{rows.length} {rows.length === 1 ? "período" : "períodos"}</strong>
                <span aria-hidden="true">·</span>
                <span>{total} días en total</span>
                {caption && <>
                    <span aria-hidden="true">·</span>
                    <span>{caption}</span>
                </>}
            </p>

            {dated && (
                <div className="flex gap-1" role="img" aria-label="Los períodos a lo largo del año escolar">
                    {items.map(({row, status}) => (
                        <span key={row.key} className="h-2 rounded-full" style={{
                            flexGrow: row.days, flexBasis: 0,
                            background: status?.label === "Terminado" ? "var(--border-strong)"
                                : status?.label === "En curso" ? "var(--success)" : "var(--accent-soft)",
                        }} title={`${row.code}: ${durationText(row.days)}`}/>
                    ))}
                </div>
            )}

            <ol className="space-y-2">
                {items.map(({row, status}) => (
                    <li key={row.key}
                        className={`grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-[16px] border p-3 sm:p-4 ${hasActions
                            ? "sm:grid-cols-[auto_1fr_auto_auto_auto]" : "sm:grid-cols-[auto_1fr_auto_auto]"}`}
                        style={{borderColor: status?.label === "En curso" ? "var(--success)" : "var(--border-soft)", background: "var(--surface-muted)"}}>
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-sm font-extrabold"
                              style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{row.code}</span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="truncate text-sm" style={{color: "var(--text-primary)"}}>{row.name}</strong>
                                {row.badges}
                            </div>
                            <span className="text-xs" style={{color: "var(--text-secondary)"}}>
                                {row.start && row.end ? `${formatDate(row.start)} – ${formatDate(row.end)}` : row.range}
                            </span>
                        </div>
                        <span className="col-start-2 text-xs font-semibold sm:col-start-auto sm:text-right" style={{color: "var(--text-secondary)"}}>
                            <i className="fa fa-hourglass-half me-1.5" style={{color: "var(--text-tertiary)"}}/>{durationText(row.days)}
                        </span>
                        {status ? (
                            <span className="col-start-2 inline-flex w-fit flex-col rounded-[12px] px-3 py-1.5 text-xs font-bold sm:col-start-auto sm:min-w-[7.5rem]"
                                  style={{background: status.background, color: status.color}}>
                                <span><i className={`fa ${status.icon} me-1.5`}/>{status.label}</span>
                                {status.detail && <span className="font-medium opacity-80">{status.detail}</span>}
                            </span>
                        ) : <span className="hidden sm:block"/>}
                        {hasActions && <div className="col-start-2 flex items-center gap-1 sm:col-start-auto">{row.actions}</div>}
                    </li>
                ))}
            </ol>
        </div>
    );
};
