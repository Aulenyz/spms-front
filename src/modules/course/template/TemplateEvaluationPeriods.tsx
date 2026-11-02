import {useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";

import {queryKeys} from "../../../app/query/queryKeys.ts";
import {TemplatePeriod} from "../../../domain/model/course/EvaluationPeriod.ts";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";

const service = CourseTemplateService.instance;

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** Días de cada mes; febrero admite el 29 (en años no bisiestos queda en el 28). */
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Calendario escolar agosto–junio repartido en 3 o 4 períodos. */
const PRESETS: Record<string, TemplatePeriod[]> = {
    "3 períodos (ago–jun)": [
        {name: "Período 1", startMonth: 8, startDay: 1, endMonth: 10, endDay: 31},
        {name: "Período 2", startMonth: 11, startDay: 1, endMonth: 2, endDay: 28},
        {name: "Período 3", startMonth: 3, startDay: 1, endMonth: 6, endDay: 30},
    ],
    "4 períodos (ago–jun)": [
        {name: "Período 1", startMonth: 8, startDay: 1, endMonth: 10, endDay: 15},
        {name: "Período 2", startMonth: 10, startDay: 16, endMonth: 12, endDay: 31},
        {name: "Período 3", startMonth: 1, startDay: 1, endMonth: 4, endDay: 15},
        {name: "Período 4", startMonth: 4, startDay: 16, endMonth: 6, endDay: 30},
    ],
};

const message = (error: unknown, fallback: string): string => {
    const text = typeof error === "object" && error !== null ? (error as { message?: unknown }).message : undefined;
    return typeof text === "string" && text.trim() ? text : fallback;
};

const formatDay = (day: number, month: number) => `${day} ${MONTH_SHORT[month - 1]}`;

const nextDay = (period: TemplatePeriod): { month: number; day: number } => {
    if (period.endDay < DAYS_IN_MONTH[period.endMonth - 1]) return {month: period.endMonth, day: period.endDay + 1};
    return {month: period.endMonth === 12 ? 1 : period.endMonth + 1, day: 1};
};

/**
 * Períodos de evaluación del curso base (P1, P2...), con día y mes. Los cursos que se generan desde este curso base
 * nacen con ellos, ubicados dentro del año escolar; en cada curso se pueden ajustar.
 */
export const TemplateEvaluationPeriods = ({templateId, canEdit}: { templateId: string; canEdit: boolean }) => {
    const queryClient = useQueryClient();
    const queryKey = [...queryKeys.courseTemplates.all, "evaluation-periods", templateId];
    const periodsQuery = useQuery({
        queryKey,
        queryFn: () => service.evaluationPeriods(templateId),
        meta: {errorMessage: "No se pudieron cargar los períodos de evaluación."},
    });
    const saved: TemplatePeriod[] = periodsQuery.data ?? [];
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<TemplatePeriod[]>([]);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!editing) setDraft(saved.map((period) => ({...period})));
    }, [periodsQuery.data, editing]); // eslint-disable-line react-hooks/exhaustive-deps

    const update = (index: number, change: Partial<TemplatePeriod>) =>
        setDraft((current) => current.map((period, position) => position === index ? {...period, ...change} : period));

    const addPeriod = () => setDraft((current) => {
        const last = current[current.length - 1];
        const start = last ? nextDay(last) : {month: 8, day: 1};
        return [...current, {
            name: `Período ${current.length + 1}`,
            startMonth: start.month, startDay: start.day,
            endMonth: start.month, endDay: DAYS_IN_MONTH[start.month - 1],
        }];
    });

    const save = async () => {
        setBusy(true);
        try {
            await service.saveEvaluationPeriods(templateId, draft);
            await queryClient.invalidateQueries({queryKey});
            setEditing(false);
            toast.success("Períodos del curso base guardados. Los cursos que se generen nacerán con ellos.");
        } catch (error) {
            toast.error(message(error, "No se pudieron guardar los períodos."));
        } finally {
            setBusy(false);
        }
    };

    const apply = async () => {
        setBusy(true);
        try {
            const sections = await service.applyEvaluationPeriods(templateId);
            void queryClient.invalidateQueries({queryKey: queryKeys.courses.all});
            toast.success(sections.length
                ? `Períodos aplicados a ${sections.join(", ")}.`
                : "Los cursos de este año ya tienen sus períodos.");
        } catch (error) {
            toast.error(message(error, "No se pudieron aplicar los períodos."));
        } finally {
            setBusy(false);
        }
    };

    const actions = canEdit && (editing ? <>
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setEditing(false)}>Cancelar</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => void save()}>
            <i className={busy ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{busy ? "Guardando..." : "Guardar períodos"}
        </button>
    </> : <>
        {saved.length > 0 && (
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void apply()}
                    title="Da estos períodos a los cursos del año actual que todavía no tienen">
                <i className="fa fa-share-from-square"/>Aplicar a los cursos del año
            </button>
        )}
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => setEditing(true)}>
            <i className={saved.length ? "fa fa-pen" : "fa fa-plus"}/>{saved.length ? "Editar períodos" : "Definir períodos"}
        </button>
    </>);

    return (
        <DetailSection title="Períodos de evaluación"
                       description="Los cursos que se generen con este curso base nacen con estos períodos, ubicados dentro del año escolar."
                       actions={actions}>
            {periodsQuery.isLoading ? <LoadingContent loading className="py-10"/> : editing ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>Plantillas rápidas:</span>
                        {Object.entries(PRESETS).map(([label, periods]) => (
                            <button key={label} type="button" className="btn btn-xs" onClick={() => setDraft(periods.map((period) => ({...period})))}>
                                <i className="fa fa-wand-magic-sparkles"/>{label}
                            </button>
                        ))}
                    </div>
                    {draft.length === 0 && (
                        <p className="text-sm" style={{color: "var(--text-secondary)"}}>Sin períodos. Agrega el primero o usa una plantilla rápida.</p>
                    )}
                    <ol className="space-y-3">
                        {draft.map((period, index) => (
                            <li key={index} className="grid items-end gap-3 rounded-[16px] border p-4 lg:grid-cols-[3rem_minmax(0,1fr)_auto_auto_auto]"
                                style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] text-sm font-extrabold"
                                      style={{background: "var(--accent-soft)", color: "var(--accent)"}}>P{index + 1}</span>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Nombre</label>
                                    <label className="input input-sm w-full">
                                        <input maxLength={64} value={period.name} placeholder={`Período ${index + 1}`}
                                               onChange={(event) => update(index, {name: event.target.value})}/>
                                    </label>
                                </div>
                                <DayMonthField label="Desde" day={period.startDay} month={period.startMonth}
                                               onChange={(day, month) => update(index, {startDay: day, startMonth: month})}/>
                                <DayMonthField label="Hasta" day={period.endDay} month={period.endMonth}
                                               onChange={(day, month) => update(index, {endDay: day, endMonth: month})}/>
                                <button type="button" className="row-action mb-1" title="Quitar" aria-label={`Quitar P${index + 1}`}
                                        disabled={index !== draft.length - 1}
                                        onClick={() => setDraft((current) => current.slice(0, -1))}>
                                    <i className="fa fa-trash"/>
                                </button>
                            </li>
                        ))}
                    </ol>
                    <button type="button" className="btn btn-sm" disabled={draft.length >= 12} onClick={addPeriod}>
                        <i className="fa fa-plus"/>Agregar período
                    </button>
                    <p className="text-xs" style={{color: "var(--text-tertiary)"}}>
                        <i className="fa fa-circle-info me-1"/>
                        Cada período empieza después de que termina el anterior y todos caben en un año. Al generar los cursos se ubican en el
                        año escolar; si el primero empieza poco antes que el año, arranca con el año.
                    </p>
                </div>
            ) : saved.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed px-6 py-8 text-center"
                     style={{borderColor: "var(--border-strong)", background: "var(--surface-muted)"}}>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] text-lg"
                          style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                        <i className="fa fa-clipboard-check"/>
                    </span>
                    <strong className="text-sm" style={{color: "var(--text-primary)"}}>Este curso base aún no tiene períodos</strong>
                    <p className="max-w-md text-sm" style={{color: "var(--text-secondary)"}}>
                        Defínelos una vez (por ejemplo, P1 de agosto a octubre) y todos los cursos que se generen con este curso base los tendrán.
                    </p>
                </div>
            ) : (
                <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {saved.map((period) => (
                        <li key={period.id} className="flex items-center gap-3 rounded-[16px] border p-4"
                            style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-sm font-extrabold"
                                  style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{period.code}</span>
                            <div className="min-w-0">
                                <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{period.name}</strong>
                                <span className="text-xs" style={{color: "var(--text-secondary)"}}>
                                    {formatDay(period.startDay, period.startMonth)} – {formatDay(period.endDay, period.endMonth)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </DetailSection>
    );
};

/** Día y mes (sin año). */
const DayMonthField = ({label, day, month, onChange}: {
    label: string;
    day: number;
    month: number;
    onChange: (day: number, month: number) => void;
}) => (
    <div className="space-y-1">
        <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>{label}</label>
        <div className="flex gap-2">
            <select className="select select-sm w-[4.5rem]" value={day} aria-label={`${label}: día`}
                    onChange={(event) => onChange(Number(event.target.value), month)}>
                {Array.from({length: DAYS_IN_MONTH[month - 1]}, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>{value}</option>
                ))}
            </select>
            <select className="select select-sm w-[8.5rem]" value={month} aria-label={`${label}: mes`}
                    onChange={(event) => {
                        const nextMonth = Number(event.target.value);
                        onChange(Math.min(day, DAYS_IN_MONTH[nextMonth - 1]), nextMonth);
                    }}>
                {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
        </div>
    </div>
);
