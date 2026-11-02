import {ReactNode, useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";

import {queryKeys} from "../../../app/query/queryKeys.ts";
import {TemplatePeriod} from "../../../domain/model/course/EvaluationPeriod.ts";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {useCurrentPeriod} from "../../../hooks/queries/useCurrentPeriod.ts";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";

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

const PRESET_DESCRIPTIONS: Record<string, string> = {
    "3 períodos (ago–jun)": "Año escolar en trimestres.",
    "4 períodos (ago–jun)": "Año escolar en cuatro cortes de notas.",
};

/** Cuánto antes del año escolar puede empezar P1 y aun así arrancar con el año (igual que en la API). */
const FIRST_PERIOD_TOLERANCE_DAYS = 62;

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
    const currentPeriod = useCurrentPeriod({silent: true}).data;
    const yearStart = parseDate(currentPeriod?.start);
    const yearEnd = parseDate(currentPeriod?.end);
    const schoolYear: SchoolYear | undefined = yearStart && yearEnd ? {name: currentPeriod?.name, start: yearStart, end: yearEnd} : undefined;
    const [cloning, setCloning] = useState(false);
    const [section, setSection] = useState<"presets" | "periods">("presets");
    const [chosen, setChosen] = useState<string | null>(null);

    useEffect(() => {
        if (!editing) setDraft(saved.map((period) => ({...period})));
    }, [periodsQuery.data, editing]); // eslint-disable-line react-hooks/exhaustive-deps

    const update = (index: number, change: Partial<TemplatePeriod>) =>
        setDraft((current) => current.map((period, position) => position === index ? {...period, ...change} : period));

    const choosePreset = (label: string, periods: TemplatePeriod[]) => {
        setDraft(periods.map((period) => ({...period})));
        setChosen(label);
        setSection("periods");
    };

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

    const openEditor = () => {
        setDraft(saved.map((period) => ({...period})));
        setChosen(null);
        setSection(saved.length ? "periods" : "presets");
        setEditing(true);
    };

    const actions = canEdit && <>
        {saved.length > 0 && (
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setCloning(true)}
                    title="Copia estos períodos a otros cursos base del mismo tipo">
                <i className="fa fa-clone"/>Clonar a otros cursos base
            </button>
        )}
        {saved.length > 0 && (
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void apply()}
                    title="Da estos períodos a los cursos del año actual que todavía no tienen">
                <i className="fa fa-share-from-square"/>Aplicar a los cursos del año
            </button>
        )}
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={openEditor}>
            <i className={saved.length ? "fa fa-pen" : "fa fa-plus"}/>{saved.length ? "Editar períodos" : "Definir períodos"}
        </button>
    </>;

    const problems = draft.map((_, index) => problemOf(draft, index, schoolYear));
    const invalid = problems.some(Boolean) || draft.some((period) => !period.name.trim());

    return <>
        <DetailSection title="Períodos de evaluación"
                       description="Los cursos que se generen con este curso base nacen con estos períodos, ubicados dentro del año escolar."
                       actions={actions}>
            {periodsQuery.isLoading ? <LoadingContent loading className="py-10"/> : saved.length === 0 ? (
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
                    {canEdit && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={openEditor}>
                            <i className="fa fa-plus"/>Definir períodos
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <Timeline periods={saved}/>
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
                </div>
            )}
        </DetailSection>

        <LeftModal title={saved.length ? "Editar períodos de evaluación" : "Definir períodos de evaluación"}
                   isOpen={canEdit && editing} onClose={() => !busy && setEditing(false)} className="h-full w-[min(520px,100vw)]">
            <div className="-mx-4 flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                        Indica el día y el mes en que empieza y termina cada período. El año lo pone cada año escolar.
                    </p>
                    <AccordionPanel step={1} title="Usar un ejemplo" open={section === "presets"}
                                    summary={chosen ?? "Opcional: arranca con un calendario ya armado"}
                                    onToggle={() => setSection(section === "presets" ? "periods" : "presets")}>
                        <div className="grid gap-2">
                            {Object.entries(PRESETS).map(([label, periods]) => (
                                <button key={label} type="button" onClick={() => choosePreset(label, periods)}
                                        className="flex items-center gap-3 rounded-[16px] border p-3 text-left transition hover:shadow-sm"
                                        style={{borderColor: chosen === label ? "var(--accent)" : "var(--border-soft)", background: "var(--surface-muted)"}}>
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                                          style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                        <i className="fa fa-wand-magic-sparkles"/>
                                    </span>
                                    <span className="min-w-0">
                                        <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{label}</strong>
                                        <span className="text-xs" style={{color: "var(--text-secondary)"}}>
                                            {PRESET_DESCRIPTIONS[label]}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </AccordionPanel>

                    <AccordionPanel step={2} title="Ajustar los períodos" open={section === "periods"}
                                    summary={draft.length ? `${draft.length} ${draft.length === 1 ? "período" : "períodos"} · ${formatDay(draft[0].startDay, draft[0].startMonth)} – ${formatDay(draft[draft.length - 1].endDay, draft[draft.length - 1].endMonth)}` : "Sin períodos todavía"}
                                    onToggle={() => setSection(section === "periods" ? "presets" : "periods")}>
                        <div className="space-y-4">
                            {schoolYear && (
                                <p className="flex items-center gap-2 rounded-[12px] px-3 py-2 text-xs font-semibold"
                                   style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                    <i className="fa fa-calendar" style={{color: "var(--accent)"}}/>
                                    Año escolar {schoolYear.name ? `${schoolYear.name}: ` : ""}{formatDate(schoolYear.start)} – {formatDate(schoolYear.end)}.
                                    Ningún período puede terminar después.
                                </p>
                            )}
                            {draft.length > 0 && <Timeline periods={draft}/>}

                            {draft.length === 0 ? (
                                <p className="rounded-[16px] border border-dashed px-4 py-6 text-center text-sm"
                                   style={{borderColor: "var(--border-strong)", color: "var(--text-secondary)"}}>
                                    Sin períodos todavía. Usa un ejemplo o agrega el primero.
                                </p>
                            ) : (
                                <ol className="space-y-3">
                                    {draft.map((period, index) => (
                                        <li key={index} className="space-y-3 rounded-[18px] border p-4"
                                            style={{borderColor: problems[index] ? "var(--danger)" : "var(--border-soft)", background: "var(--surface-muted)"}}>
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-sm font-extrabold"
                                                      style={{background: "var(--accent-soft)", color: "var(--accent)"}}>P{index + 1}</span>
                                                <label className="input input-sm min-w-0 flex-1">
                                                    <input maxLength={64} value={period.name} placeholder={`Período ${index + 1}`} aria-label={`Nombre de P${index + 1}`}
                                                           onChange={(event) => update(index, {name: event.target.value})}/>
                                                </label>
                                                <span className="hidden text-xs font-semibold sm:inline" style={{color: "var(--text-tertiary)"}}>
                                                    {lengthOf(period)} días
                                                </span>
                                                <button type="button" className="row-action" title={index === draft.length - 1 ? "Quitar" : "Solo se puede quitar el último"}
                                                        aria-label={`Quitar P${index + 1}`} disabled={index !== draft.length - 1}
                                                        onClick={() => setDraft((current) => current.slice(0, -1))}>
                                                    <i className="fa fa-trash"/>
                                                </button>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <DayMonthField label="Empieza" day={period.startDay} month={period.startMonth}
                                                               onChange={(day, month) => update(index, {startDay: day, startMonth: month})}/>
                                                <DayMonthField label="Termina" day={period.endDay} month={period.endMonth}
                                                               onChange={(day, month) => update(index, {endDay: day, endMonth: month})}/>
                                            </div>
                                            {problems[index] && (
                                                <p className="text-xs font-semibold" style={{color: "var(--danger)"}}>
                                                    <i className="fa fa-triangle-exclamation me-1"/>{problems[index]}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            )}

                            <button type="button" className="btn btn-sm w-full border-dashed" disabled={draft.length >= 12} onClick={addPeriod}>
                                <i className="fa fa-plus"/>Agregar período {draft.length ? `P${draft.length + 1}` : "P1"}
                            </button>
                        </div>
                    </AccordionPanel>

                    <p className="text-xs" style={{color: "var(--text-tertiary)"}}>
                        <i className="fa fa-circle-info me-1"/>
                        Cada período empieza después de que termina el anterior y todos caben en un año. Al generar los cursos se ubican en el
                        año escolar; si el primero empieza poco antes que el año, arranca con el año.
                    </p>
                </div>

                <footer className="flex justify-end gap-2 border-t px-4 pt-4"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                    <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setEditing(false)}>Cancelar</button>
                    <button type="button" className="btn btn-sm btn-primary" disabled={busy || invalid} onClick={() => void save()}>
                        <i className={busy ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{busy ? "Guardando..." : "Guardar períodos"}
                    </button>
                </footer>
            </div>
        </LeftModal>

        <LeftModal title="Clonar períodos" isOpen={canEdit && cloning} onClose={() => setCloning(false)} className="h-full w-[min(480px,100vw)]">
            {cloning && <ClonePeriods templateId={templateId} periods={saved} onDone={() => setCloning(false)}/>}
        </LeftModal>
    </>;
};

/** Elige a qué cursos base del mismo tipo se copian los períodos; los que ya tenían se reemplazan. */
const ClonePeriods = ({templateId, periods, onDone}: { templateId: string; periods: TemplatePeriod[]; onDone: VoidFunction }) => {
    const queryClient = useQueryClient();
    const targetsQuery = useQuery({
        queryKey: [...queryKeys.courseTemplates.all, "evaluation-periods", templateId, "clone-targets"],
        queryFn: () => service.evaluationPeriodCloneTargets(templateId),
        meta: {errorMessage: "No se pudieron cargar los cursos base."},
    });
    const targets = targetsQuery.data ?? [];
    const [selected, setSelected] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    const replacing = targets.filter((target) => selected.includes(target.id) && target.periods > 0).length;

    const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

    const clone = async () => {
        setBusy(true);
        try {
            const names = await service.cloneEvaluationPeriods(templateId, selected);
            void queryClient.invalidateQueries({queryKey: [...queryKeys.courseTemplates.all, "evaluation-periods"]});
            toast.success(`Períodos clonados a ${names.join(", ")}.`);
            onDone();
        } catch (error) {
            toast.error(message(error, "No se pudieron clonar los períodos."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="-mx-4 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    Copia estos períodos a otros cursos base del mismo tipo. Los cursos que se generen con ellos nacerán con los mismos períodos.
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {periods.map((period) => (
                        <span key={period.id} className="rounded-full px-2.5 py-1 text-xs font-bold"
                              style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                            {period.code} · {formatDay(period.startDay, period.startMonth)} – {formatDay(period.endDay, period.endMonth)}
                        </span>
                    ))}
                </div>
                {targetsQuery.isLoading ? <LoadingContent loading className="py-10"/> : targets.length === 0 ? (
                    <p className="rounded-[16px] border border-dashed px-4 py-6 text-center text-sm"
                       style={{borderColor: "var(--border-strong)", color: "var(--text-secondary)"}}>
                        No hay otros cursos base del mismo tipo.
                    </p>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide" style={{color: "var(--text-tertiary)"}}>
                                Cursos base del mismo tipo
                            </span>
                            <button type="button" className="btn btn-xs btn-ghost"
                                    onClick={() => setSelected(selected.length === targets.length ? [] : targets.map((target) => target.id))}>
                                {selected.length === targets.length ? "Quitar todos" : "Elegir todos"}
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {targets.map((target) => (
                                <li key={target.id}>
                                    <label className="flex cursor-pointer items-center gap-3 rounded-[16px] border p-3"
                                           style={{borderColor: selected.includes(target.id) ? "var(--accent)" : "var(--border-soft)", background: "var(--surface-muted)"}}>
                                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={selected.includes(target.id)}
                                               onChange={() => toggle(target.id)}/>
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>
                                                {target.name}{!target.active && <span className="ms-2 text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>Inactivo</span>}
                                            </strong>
                                            <span className="text-xs" style={{color: target.periods ? "var(--warning)" : "var(--text-secondary)"}}>
                                                {[target.specialization, target.periods
                                                    ? `Ya tiene ${target.periods} ${target.periods === 1 ? "período" : "períodos"}: se reemplazan`
                                                    : "Sin períodos"].filter(Boolean).join(" · ")}
                                            </span>
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {replacing > 0 && (
                    <p className="text-xs font-semibold" style={{color: "var(--danger)"}}>
                        <i className="fa fa-triangle-exclamation me-1"/>
                        {replacing === 1 ? "1 curso base perderá sus períodos actuales." : `${replacing} cursos base perderán sus períodos actuales.`}
                    </p>
                )}
            </div>
            <footer className="flex justify-end gap-2 border-t px-4 pt-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="button" className="btn btn-sm" disabled={busy} onClick={onDone}>Cancelar</button>
                <button type="button" className="btn btn-sm btn-primary" disabled={busy || selected.length === 0} onClick={() => void clone()}>
                    <i className={busy ? "fa fa-spinner fa-spin" : "fa fa-clone"}/>
                    {busy ? "Clonando..." : selected.length ? `Clonar a ${selected.length}` : "Clonar"}
                </button>
            </footer>
        </div>
    );
};

/** Día del año en un año bisiesto de referencia (1 ene = 0). */
const dayOfYear = (month: number, day: number) => DAYS_IN_MONTH.slice(0, month - 1).reduce((sum, days) => sum + days, 0) + day - 1;
/** Días desde el inicio del primer período, dando la vuelta al año. */
const offset = (from: number, month: number, day: number) => (dayOfYear(month, day) - from + 366) % 366;
const lengthOf = (period: TemplatePeriod) => offset(dayOfYear(period.startMonth, period.startDay), period.endMonth, period.endDay) + 1;

/** Qué le falta a un período para ser válido: debe seguir al anterior y caber en el año junto con los demás. */
const problemOf = (periods: TemplatePeriod[], index: number, year?: SchoolYear): string | null => {
    const period = periods[index];
    if (!period.name.trim()) return "Ponle un nombre al período.";
    const sequenceProblem = index === 0 ? null : orderProblemOf(periods, index);
    if (sequenceProblem || !year) return sequenceProblem;
    const end = placeInYear(periods, year)[index].end;
    if (end > year.end) return `Termina el ${formatDate(end)}, después del fin del año escolar (${formatDate(year.end)}).`;
    return null;
};

const orderProblemOf = (periods: TemplatePeriod[], index: number): string | null => {
    const period = periods[index];
    const from = dayOfYear(periods[0].startMonth, periods[0].startDay);
    const previous = periods[index - 1];
    const previousEnd = offset(from, previous.endMonth, previous.endDay);
    const start = offset(from, period.startMonth, period.startDay);
    const end = offset(from, period.endMonth, period.endDay);
    if (start <= previousEnd) return `Debe empezar después del ${formatDay(previous.endDay, previous.endMonth)}, cuando termina P${index}.`;
    if (end < start) return "Termina antes de empezar o se pasa del año desde P1.";
    return null;
};

type SchoolYear = { name?: string; start: Date; end: Date };

/** Fecha local a partir de "aaaa-mm-dd". */
const parseDate = (value?: string) => {
    const [year, month, day] = (value ?? "").split("-").map(Number);
    return year && month && day ? new Date(year, month - 1, day) : null;
};
const formatDate = (date: Date) => `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Primera fecha desde {@code from} con ese día y mes (el 29 feb cae en 28 en años no bisiestos), como en la API. */
const nextDate = (month: number, day: number, from: Date) => {
    const at = (year: number) => new Date(year, month - 1, Math.min(day, new Date(year, month, 0).getDate()));
    const candidate = at(from.getFullYear());
    return candidate < from ? at(from.getFullYear() + 1) : candidate;
};

/** Fechas reales de cada período dentro del año escolar, igual que al generar los cursos (sin recortar al final). */
const placeInYear = (periods: TemplatePeriod[], year: SchoolYear) => {
    let cursor = year.start;
    return periods.map((period, index) => {
        let start = nextDate(period.startMonth, period.startDay, index === 0 ? addDays(year.start, -FIRST_PERIOD_TOLERANCE_DAYS) : cursor);
        if (start < year.start) start = year.start;
        const end = nextDate(period.endMonth, period.endDay, start);
        cursor = addDays(end, 1);
        return {start, end};
    });
};

/** Franja proporcional del año escolar con cada período. */
const Timeline = ({periods}: { periods: TemplatePeriod[] }) => {
    const from = dayOfYear(periods[0].startMonth, periods[0].startDay);
    const last = periods[periods.length - 1];
    const total = Math.max(offset(from, last.endMonth, last.endDay) + 1, 1);
    return (
        <div className="space-y-1.5">
            <div className="relative h-9 overflow-hidden rounded-[12px]" style={{background: "var(--surface-muted)"}}>
                {periods.map((period, index) => {
                    const start = offset(from, period.startMonth, period.startDay);
                    const width = offset(from, period.endMonth, period.endDay) - start + 1;
                    if (index > 0 && orderProblemOf(periods, index)) return null;
                    return (
                        <span key={index} className="absolute inset-y-1 flex items-center justify-center overflow-hidden rounded-[9px] text-xs font-extrabold"
                              title={`${period.name}: ${formatDay(period.startDay, period.startMonth)} – ${formatDay(period.endDay, period.endMonth)}`}
                              style={{
                                  left: `calc(${(start / total) * 100}% + 2px)`, width: `calc(${(width / total) * 100}% - 4px)`,
                                  background: index % 2 ? "var(--accent-soft)" : "var(--accent)", color: index % 2 ? "var(--accent)" : "white",
                              }}>P{index + 1}</span>
                    );
                })}
            </div>
            <div className="flex justify-between text-[11px] font-semibold" style={{color: "var(--text-tertiary)"}}>
                <span>{formatDay(periods[0].startDay, periods[0].startMonth)}</span>
                <span>{formatDay(last.endDay, last.endMonth)}</span>
            </div>
        </div>
    );
};

/** Bloque plegable del editor: solo uno queda abierto, el otro muestra un resumen para volver a él. */
const AccordionPanel = ({step, title, summary, open, onToggle, children}: {
    step: number;
    title: string;
    summary: string;
    open: boolean;
    onToggle: VoidFunction;
    children: ReactNode;
}) => (
    <section className="overflow-hidden rounded-[18px] border" style={{borderColor: open ? "var(--accent)" : "var(--border-soft)"}}>
        <button type="button" onClick={onToggle} aria-expanded={open}
                className="flex w-full items-center gap-3 p-4 text-left" style={{background: open ? "var(--accent-soft)" : "var(--surface)"}}>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
                  style={{background: open ? "var(--accent)" : "var(--surface-muted)", color: open ? "white" : "var(--text-secondary)"}}>{step}</span>
            <span className="min-w-0 flex-1">
                <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{title}</strong>
                {!open && <span className="block truncate text-xs" style={{color: "var(--text-secondary)"}}>{summary}</span>}
            </span>
            <i className={`fa fa-chevron-${open ? "up" : "down"} text-xs`} style={{color: "var(--text-tertiary)"}}/>
        </button>
        {open && <div className="p-4">{children}</div>}
    </section>
);

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
            <select className="select select-sm w-[5rem] shrink-0" value={day} aria-label={`${label}: día`}
                    onChange={(event) => onChange(Number(event.target.value), month)}>
                {Array.from({length: DAYS_IN_MONTH[month - 1]}, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>{value}</option>
                ))}
            </select>
            <select className="select select-sm min-w-0 flex-1" value={month} aria-label={`${label}: mes`}
                    onChange={(event) => {
                        const nextMonth = Number(event.target.value);
                        onChange(Math.min(day, DAYS_IN_MONTH[nextMonth - 1]), nextMonth);
                    }}>
                {MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
        </div>
    </div>
);
