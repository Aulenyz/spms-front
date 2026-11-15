import {ReactNode, useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";

import {queryKeys} from "../../../app/query/queryKeys.ts";
import {GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {TemplateCloneTarget, TemplatePeriod} from "../../../domain/model/course/EvaluationPeriod.ts";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {useCurrentPeriod} from "../../../hooks/queries/useCurrentPeriod.ts";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DateRangePicker} from "../../../components/io/DateRangePicker.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";

const service = CourseTemplateService.instance;

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** Días de cada mes; febrero admite el 29 (en años no bisiestos queda en el 28). */
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

type Preset = { label: string; description: string; periods: TemplatePeriod[] };

const named = (name: string, ranges: Array<[number, number, number, number]>): TemplatePeriod[] =>
    ranges.map(([startMonth, startDay, endMonth, endDay], index) => ({name: `${name} ${index + 1}`, startMonth, startDay, endMonth, endDay}));

/** Formas de repartir el año escolar agosto–junio que se usan en colegios de República Dominicana. */
const PRESETS: Preset[] = [
    {
        label: "4 períodos",
        description: "El año dividido en cuatro partes, como lo trabaja el MINERD.",
        periods: named("Período", [[8, 1, 10, 31], [11, 1, 1, 31], [2, 1, 3, 31], [4, 1, 6, 30]]),
    },
    {
        label: "3 trimestres",
        description: "El año dividido en tres partes; común en colegios privados.",
        periods: named("Trimestre", [[8, 1, 11, 30], [12, 1, 2, 29], [3, 1, 6, 30]]),
    },
    {
        label: "2 semestres",
        description: "El año dividido en dos mitades.",
        periods: named("Semestre", [[8, 1, 12, 31], [1, 1, 6, 30]]),
    },
    {
        label: "5 bimestres",
        description: "El año dividido en cinco partes, para entregar notas más seguido.",
        periods: named("Bimestre", [[8, 1, 9, 30], [10, 1, 11, 30], [12, 1, 1, 31], [2, 1, 3, 31], [4, 1, 6, 30]]),
    },
];

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
    const [confirmApply, setConfirmApply] = useState(false);
    const [section, setSection] = useState<"presets" | "periods">("presets");
    const [chosen, setChosen] = useState<string | null>(null);

    useEffect(() => {
        if (!editing) setDraft(saved.map((period) => ({...period})));
    }, [periodsQuery.data, editing]); // eslint-disable-line react-hooks/exhaustive-deps

    const update = (index: number, change: Partial<TemplatePeriod>) =>
        setDraft((current) => current.map((period, position) => position === index ? {...period, ...change} : period));

    const choosePreset = (preset: Preset) => {
        setDraft(fitToYear(preset.periods, schoolYear));
        setChosen(preset.label);
        setSection("periods");
    };

    /** Quita un período; los siguientes se renumeran y, si conservan el nombre por defecto, también se renombran. */
    const remove = (index: number) => setDraft((current) => current
        .filter((_, position) => position !== index)
        .map((period, position) => {
            const kind = /^(Período|Trimestre|Semestre|Bimestre) \d+$/.exec(period.name.trim())?.[1];
            return kind ? {...period, name: `${kind} ${position + 1}`} : period;
        }));

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
            const result = await service.applyEvaluationPeriods(templateId);
            const locked = Array.isArray(result) ? [] : result?.lockedPeriods ?? [];
            void queryClient.invalidateQueries({queryKey: queryKeys.courses.all});
            setConfirmApply(false);
            toast.success("Los cursos de este año ya tienen estos períodos de evaluación.");
            if (locked.length) toast.info(`${locked.join(", ")} ya ${locked.length === 1 ? "está cursado y no se cambió" : "están cursados y no se cambiaron"}. Solo se actualizan los períodos nuevos.`,
                {autoClose: 9000});
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
                    title="Copia estos períodos a otros cursos base">
                <i className="fa fa-clone"/>Clonar
            </button>
        )}
        {saved.length > 0 && (
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setConfirmApply(true)}
                    title="Lleva estos períodos a los cursos de este año escolar">
                <i className="fa fa-share-from-square"/>Aplicar cambios
            </button>
        )}
        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={openEditor}>
            <i className={saved.length ? "fa fa-pen" : "fa fa-plus"}/>{saved.length ? "Editar" : "Definir"}
        </button>
    </>;

    const placed = schoolYear ? placeInYear(draft, schoolYear) : [];
    const problems = draft.map((_, index) => problemOf(draft, index, schoolYear));
    const invalid = problems.some(Boolean) || draft.some((period) => !period.name.trim());

    return <>
        <DetailSection title="Períodos de evaluación"
                       description="Cada curso de este curso base sigue estos períodos. Las fechas se ubican solas en cada año escolar y los cursos que se generan automáticamente se mantienen al día; los períodos ya cursados no cambian."
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
                        Defínelos una vez (por ejemplo, P1 de agosto a octubre) y todos los cursos de este curso base los tendrán al generarlos o actualizarlos.
                    </p>
                    {canEdit && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={openEditor}>
                            <i className="fa fa-plus"/>Definir períodos
                        </button>
                    )}
                </div>
            ) : (
                <PeriodList periods={saved} year={schoolYear}/>
            )}
        </DetailSection>

        <LeftModal title={saved.length ? "Editar períodos de evaluación" : "Definir períodos de evaluación"}
                   isOpen={canEdit && editing} onClose={() => !busy && setEditing(false)} className="h-full w-[min(520px,100vw)]">
            <div className="-mx-4 flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                        Un período de evaluación es cada tramo del año en que se califica y se entregan notas (P1, P2...). Aquí
                        defines cuándo empieza y termina cada uno.
                    </p>
                    <AccordionPanel step={1} title="Elige en cuántas partes se divide el año" open={section === "presets"}
                                    summary={chosen ?? "Opcional: empieza con las fechas ya calculadas"}
                                    onToggle={() => setSection(section === "presets" ? "periods" : "presets")}>
                        <div className="grid gap-2">
                            <p className="text-xs" style={{color: "var(--text-secondary)"}}>
                                {schoolYear
                                    ? <>Toca una opción y las fechas salen ya calculadas para el año escolar{schoolYear.name ? ` ${schoolYear.name}` : ""}{" "}
                                        (<strong>{formatDate(schoolYear.start)} – {formatDate(schoolYear.end)}</strong>). En el paso 2 puedes cambiarlas.</>
                                    : "Toca una opción para empezar con sus fechas. En el paso 2 puedes cambiarlas."}
                            </p>
                            {PRESETS.map((preset) => (
                                <button key={preset.label} type="button" onClick={() => choosePreset(preset)}
                                        className="space-y-2.5 rounded-[16px] border p-3 text-left transition hover:shadow-sm"
                                        style={{borderColor: chosen === preset.label ? "var(--accent)" : "var(--border-soft)", background: "var(--surface-muted)"}}>
                                    <span className="flex items-center gap-3">
                                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-base font-extrabold"
                                              style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{preset.periods.length}</span>
                                        <span className="min-w-0">
                                            <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{preset.label}</strong>
                                            <span className="block text-xs" style={{color: "var(--text-secondary)"}}>{preset.description}</span>
                                        </span>
                                    </span>
                                    <span className="grid gap-1.5 sm:grid-cols-2">
                                        {fitToYear(preset.periods, schoolYear).map((period, index) => (
                                            <span key={index} className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-xs" style={{background: "var(--surface)"}}>
                                                <strong style={{color: "var(--accent)"}}>P{index + 1}</strong>
                                                <span style={{color: "var(--text-secondary)"}}>
                                                    {formatDay(period.startDay, period.startMonth)} – {formatDay(period.endDay, period.endMonth)}
                                                </span>
                                            </span>
                                        ))}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </AccordionPanel>

                    <AccordionPanel step={2} title="Revisa o cambia las fechas" open={section === "periods"}
                                    summary={draft.length ? `${draft.length} ${draft.length === 1 ? "período" : "períodos"} · ${formatDay(draft[0].startDay, draft[0].startMonth)} – ${formatDay(draft[draft.length - 1].endDay, draft[draft.length - 1].endMonth)}` : "Sin períodos todavía"}
                                    onToggle={() => setSection(section === "periods" ? "presets" : "periods")}>
                        <div className="space-y-4">
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
                                                <button type="button" className="row-action" title="Quitar" aria-label={`Quitar P${index + 1}`}
                                                        onClick={() => remove(index)}>
                                                    <i className="fa fa-trash"/>
                                                </button>
                                            </div>
                                            {schoolYear ? (
                                                <DateRangePicker label="Desde – hasta" start={placed[index].start} end={placed[index].end}
                                                                 min={index === 0 ? schoolYear.start : minDate(addDays(placed[index - 1].end, 1), schoolYear.end)}
                                                                 max={schoolYear.end}
                                                                 onChange={(start, end) => update(index, {
                                                                     startDay: start.getDate(), startMonth: start.getMonth() + 1,
                                                                     endDay: end.getDate(), endMonth: end.getMonth() + 1,
                                                                 })}/>
                                            ) : (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <DayMonthField label="Empieza" day={period.startDay} month={period.startMonth}
                                                                   onChange={(day, month) => update(index, {startDay: day, startMonth: month})}/>
                                                    <DayMonthField label="Termina" day={period.endDay} month={period.endMonth}
                                                                   onChange={(day, month) => update(index, {endDay: day, endMonth: month})}/>
                                                </div>
                                            )}
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
                        Los períodos van uno detrás del otro, sin cruzarse, dentro del año escolar. Se guarda solo el día y el mes,
                        así que el próximo año escolar usa las mismas fechas sin volver a definirlas.
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

        <CenterModal title="Aplicar cambios" isOpen={canEdit && confirmApply}
                     onClose={() => !busy && setConfirmApply(false)} className="max-w-md">
            <div className="space-y-4">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    Los cursos de este año escolar que salieron de este curso base quedan con los mismos períodos de evaluación
                    que ves aquí: se crean los que falten, se actualizan los nombres y las fechas, y se quitan los que ya no están.
                </p>
                <p className="flex gap-2 rounded-xl p-3 text-sm" style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                    <i className="fa fa-lock mt-0.5" style={{color: "var(--text-tertiary)"}}/>
                    <span>Lo ya cursado no se toca: los períodos con calificaciones o que ya terminaron quedan como están.
                        En los demás se pierden los ajustes de fechas hechos a mano dentro de un curso.</span>
                </p>
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setConfirmApply(false)}>Cancelar</button>
                    <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => void apply()}>
                        <i className={busy ? "fa fa-spinner fa-spin" : "fa fa-share-from-square"}/>{busy ? "Aplicando..." : "Sí, aplicar"}
                    </button>
                </div>
            </div>
        </CenterModal>

        <LeftModal title="Clonar períodos" isOpen={canEdit && cloning} onClose={() => setCloning(false)} className="h-full w-[min(480px,100vw)]">
            {cloning && <ClonePeriods templateId={templateId} periods={saved} onDone={() => setCloning(false)}/>}
        </LeftModal>
    </>;
};

const DAY_MS = 86_400_000;
const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** "42 días · ≈ 6 semanas" */
const durationText = (days: number) => days >= 14 ? `${days} días · ≈ ${Math.round(days / 7)} semanas` : `${days} ${days === 1 ? "día" : "días"}`;

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

/**
 * Lista de los períodos del curso base. Con el año escolar activo muestra las fechas reales de cada uno (con año),
 * cuánto dura y dónde está hoy; sin año, solo día y mes.
 */
const PeriodList = ({periods, year}: { periods: TemplatePeriod[]; year?: SchoolYear }) => {
    const today = startOfToday();
    const placed = year ? placeInYear(periods, year) : [];
    const rows = periods.map((period, index) => {
        const range = placed[index];
        const end = range ? minDate(range.end, year!.end) : undefined;
        const days = range && end ? Math.max(daysBetween(range.start, end), 1) : lengthOf(period);
        return {period, index, start: range?.start, end, days, status: range && end ? statusOf(range.start, end, today) : null};
    });
    const total = rows.reduce((sum, row) => sum + row.days, 0);

    return (
        <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{color: "var(--text-secondary)"}}>
                <strong style={{color: "var(--text-primary)"}}>{periods.length} {periods.length === 1 ? "período" : "períodos"}</strong>
                <span aria-hidden="true">·</span>
                <span>{total} días en total</span>
                {year && <>
                    <span aria-hidden="true">·</span>
                    <span>año escolar {year.name ? `${year.name}: ` : ""}{formatDate(year.start)} – {formatDate(year.end)}</span>
                </>}
            </p>

            {year && (
                <div className="flex gap-1" role="img" aria-label="Los períodos a lo largo del año escolar">
                    {rows.map((row) => (
                        <span key={row.index} className="h-2 rounded-full" style={{
                            flexGrow: row.days, flexBasis: 0,
                            background: row.status?.label === "Terminado" ? "var(--border-strong)"
                                : row.status?.label === "En curso" ? "var(--success)" : "var(--accent-soft)",
                        }} title={`P${row.index + 1}: ${durationText(row.days)}`}/>
                    ))}
                </div>
            )}

            <ol className="space-y-2">
                {rows.map((row) => (
                    <li key={row.period.id ?? row.index}
                        className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-[16px] border p-3 sm:grid-cols-[auto_1fr_auto_auto] sm:p-4"
                        style={{borderColor: row.status?.label === "En curso" ? "var(--success)" : "var(--border-soft)", background: "var(--surface-muted)"}}>
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-sm font-extrabold"
                              style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{row.period.code ?? `P${row.index + 1}`}</span>
                        <div className="min-w-0">
                            <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{row.period.name}</strong>
                            <span className="text-xs" style={{color: "var(--text-secondary)"}}>
                                {row.start && row.end
                                    ? `${formatDate(row.start)} – ${formatDate(row.end)}`
                                    : `${formatDay(row.period.startDay, row.period.startMonth)} – ${formatDay(row.period.endDay, row.period.endMonth)}`}
                            </span>
                        </div>
                        <span className="col-start-2 text-xs font-semibold sm:col-start-auto sm:text-right" style={{color: "var(--text-secondary)"}}>
                            <i className="fa fa-hourglass-half me-1.5" style={{color: "var(--text-tertiary)"}}/>{durationText(row.days)}
                        </span>
                        {row.status && (
                            <span className="col-start-2 inline-flex w-fit flex-col rounded-[12px] px-3 py-1.5 text-xs font-bold sm:col-start-auto sm:min-w-[7.5rem]"
                                  style={{background: row.status.background, color: row.status.color}}>
                                <span><i className={`fa ${row.status.icon} me-1.5`}/>{row.status.label}</span>
                                {row.status.detail && <span className="font-medium opacity-80">{row.status.detail}</span>}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </div>
    );
};

const describeTarget = (target: TemplateCloneTarget) => [
    target.type ? GradeTypeLabel[target.type] : null,
    target.specialization,
    !target.active && "Inactivo",
    target.periods ? `Ya tiene ${target.periods} ${target.periods === 1 ? "período" : "períodos"}: se reemplazan` : "Sin períodos",
].filter(Boolean).join(" · ");

/** Busca y elige a qué cursos base se copian los períodos; los que ya tenían se reemplazan. */
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
    const [confirming, setConfirming] = useState(false);
    const replacing = targets.filter((target) => selected.includes(target.id) && target.periods > 0).length;

    const [term, setTerm] = useState("");
    const chosen = selected.map((id) => targets.find((target) => target.id === id)).filter((target) => target !== undefined);
    const available = targets.filter((target) => !selected.includes(target.id));
    const search = term.trim().toLowerCase();
    const matches = available.filter((target) => !search
        || describeTarget(target).toLowerCase().includes(search) || target.name.toLowerCase().includes(search));

    const add = (id: number) => {
        setSelected((current) => [...current, id]);
        setTerm("");
    };

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
            setConfirming(false);
            setBusy(false);
        }
    };

    return (
        <div className="-mx-4 flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                    Busca los cursos base a los que quieres copiar estos períodos. Los cursos que se generen con ellos nacerán con los mismos períodos.
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {periods.map((period) => (
                        <span key={period.id} className="rounded-full px-2.5 py-1 text-xs font-bold"
                              style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                            {period.code} · {formatDay(period.startDay, period.startMonth)} – {formatDay(period.endDay, period.endMonth)}
                        </span>
                    ))}
                </div>
                {targetsQuery.isLoading ? <LoadingContent loading className="py-10"/> : <>
                    <div className="space-y-2">
                        <label className="input input-sm w-full">
                            <i className="fa fa-search me-1 text-[var(--text-tertiary)]"/>
                            <input value={term} placeholder="Buscar curso base por nombre, tipo o área" autoFocus
                                   onChange={(event) => setTerm(event.target.value)}/>
                        </label>
                        {matches.length === 0 ? (
                            <p className="px-1 text-xs" style={{color: "var(--text-tertiary)"}}>
                                {targets.length === 0 ? "No hay otros cursos base en esta organización." : available.length === 0 ? "Ya agregaste todos los cursos base." : "Ningún curso base coincide con la búsqueda."}
                            </p>
                        ) : (
                            <ul className="max-h-56 overflow-y-auto rounded-[14px] border" style={{borderColor: "var(--border-soft)"}}>
                                {matches.map((target) => (
                                    <li key={target.id}>
                                        <button type="button" onClick={() => add(target.id)}
                                                className="flex w-full items-center gap-3 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--surface-muted)]"
                                                style={{borderColor: "var(--border-soft)"}}>
                                            <span className="min-w-0 flex-1">
                                                <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{target.name}</strong>
                                                <span className="text-xs" style={{color: "var(--text-secondary)"}}>{describeTarget(target)}</span>
                                            </span>
                                            <i className="fa fa-plus text-xs" style={{color: "var(--accent)"}}/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="space-y-2">
                        <span className="block text-xs font-semibold uppercase tracking-wide" style={{color: "var(--text-tertiary)"}}>
                            Se clonará a ({chosen.length})
                        </span>
                        {chosen.length === 0 ? (
                            <p className="rounded-[16px] border border-dashed px-4 py-5 text-center text-sm"
                               style={{borderColor: "var(--border-strong)", color: "var(--text-secondary)"}}>
                                Busca y elige los cursos base; se irán agregando aquí.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {chosen.map((target) => (
                                    <li key={target.id} className="flex items-center gap-3 rounded-[16px] border p-3"
                                        style={{borderColor: "var(--accent)", background: "var(--surface-muted)"}}>
                                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                                              style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                            <i className="fa fa-layer-group"/>
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{target.name}</strong>
                                            <span className="text-xs" style={{color: target.periods ? "var(--warning)" : "var(--text-secondary)"}}>
                                                {describeTarget(target)}
                                            </span>
                                        </span>
                                        <button type="button" className="row-action" title="Quitar" aria-label={`Quitar ${target.name}`}
                                                onClick={() => setSelected((current) => current.filter((id) => id !== target.id))}>
                                            <i className="fa fa-times"/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>}
                {replacing > 0 && (
                    <p className="text-xs font-semibold" style={{color: "var(--danger)"}}>
                        <i className="fa fa-triangle-exclamation me-1"/>
                        {replacing === 1 ? "1 curso base perderá sus períodos actuales." : `${replacing} cursos base perderán sus períodos actuales.`}
                    </p>
                )}
            </div>
            <footer className="flex justify-end gap-2 border-t px-4 pt-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="button" className="btn btn-sm" disabled={busy} onClick={onDone}>Cancelar</button>
                <button type="button" className="btn btn-sm btn-primary" disabled={busy || selected.length === 0} onClick={() => setConfirming(true)}>
                    <i className="fa fa-clone"/>
                    {selected.length ? `Clonar a ${selected.length}` : "Clonar"}
                </button>
            </footer>

            <CenterModal title="Clonar períodos" isOpen={confirming} onClose={() => !busy && setConfirming(false)} className="max-w-md">
                <div className="space-y-4">
                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                        {periods.length === 1 ? "Este período se copia" : `Estos ${periods.length} períodos se copian`} a{" "}
                        <strong style={{color: "var(--text-primary)"}}>{chosen.map((target) => target.name).join(", ")}</strong>.
                        {replacing > 0 && ` ${replacing === 1 ? "El que ya tenía períodos los pierde y queda" : `Los ${replacing} que ya tenían períodos los pierden y quedan`} con estos.`}
                    </p>
                    <p className="flex gap-2 rounded-xl p-3 text-sm" style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                        <i className="fa fa-circle-info mt-0.5" style={{color: "var(--text-tertiary)"}}/>
                        <span>Solo cambian los cursos base. Sus cursos de este año siguen igual hasta que uses "Aplicar cambios" en cada uno.</span>
                    </p>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setConfirming(false)}>Cancelar</button>
                        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => void clone()}>
                            <i className={busy ? "fa fa-spinner fa-spin" : "fa fa-clone"}/>{busy ? "Clonando..." : "Sí, clonar"}
                        </button>
                    </div>
                </div>
            </CenterModal>
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
const minDate = (first: Date, second: Date) => first < second ? first : second;
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

const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

/**
 * Acomoda un ejemplo al año escolar activo para que siempre quepa: del primer al último día del año. Si el año
 * coincide con el calendario del ejemplo se respetan sus cortes; si no (un año que empezó tarde, por ejemplo),
 * el año se reparte en las mismas proporciones.
 */
const fitToYear = (periods: TemplatePeriod[], year?: SchoolYear): TemplatePeriod[] => {
    if (!year) return periods.map((period) => ({...period}));
    const last = periods.length - 1;
    let placed = placeInYear(periods, year);
    placed[0] = {...placed[0], start: year.start};
    placed[last] = {...placed[last], end: year.end};
    const keepsItsCuts = placed.every((range, index) =>
        range.end <= year.end && daysBetween(range.start, range.end) >= lengthOf(periods[index]) / 2);
    if (!keepsItsCuts) {
        const total = daysBetween(year.start, year.end);
        const weights = periods.map(lengthOf);
        const sum = weights.reduce((all, weight) => all + weight, 0);
        let cursor = year.start;
        let covered = 0;
        placed = periods.map((_, index) => {
            covered += weights[index];
            const start = cursor;
            const cut = index === last ? year.end : addDays(year.start, Math.round(total * covered / sum) - 1);
            const end = cut < start ? start : cut;
            cursor = addDays(end, 1);
            return {start, end};
        });
    }
    return periods.map((period, index) => ({
        name: period.name,
        startMonth: placed[index].start.getMonth() + 1, startDay: placed[index].start.getDate(),
        endMonth: placed[index].end.getMonth() + 1, endDay: placed[index].end.getDate(),
    }));
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
