import {useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import clsx from "clsx";

import {queryKeys} from "../../app/query/queryKeys.ts";
import {
    EvaluationPeriod,
    EvaluationPeriodRequest,
    EvaluationPeriodState,
    EvaluationPeriodStateLabel,
} from "../../domain/model/course/EvaluationPeriod.ts";
import {CourseService} from "../../services/course/CourseService.ts";
import {DetailSection} from "../../components/ui/detail/DetailSection.tsx";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {DatePicker} from "../../components/io/DatePicker.tsx";

const courseService = CourseService.instance;

const GENERATE_OPTIONS = [2, 3, 4, 6];

const STATE_STYLE: Record<EvaluationPeriodState, { color: string; background: string }> = {
    UPCOMING: {color: "var(--text-tertiary)", background: "var(--surface-soft)"},
    OPEN: {color: "var(--accent)", background: "var(--accent-soft)"},
    ENDED: {color: "var(--success)", background: "var(--success-soft)"},
};

const message = (error: unknown, fallback: string): string => {
    const text = typeof error === "object" && error !== null ? (error as { message?: unknown }).message : undefined;
    return typeof text === "string" && text.trim() ? text : fallback;
};

const formatDate = (value: string): string => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es", {day: "numeric", month: "short", year: "numeric"});
};

const daysBetween = (from: string, to: string): number =>
    Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1);

/**
 * Períodos de evaluación del curso (P1, P2...): los profesores califican cada materia por período y publican
 * desde la app. Son sucesivos y van dentro del año escolar.
 */
export const CourseEvaluationPeriods = ({courseId, hasSections}: { courseId: string; hasSections: boolean }) => {
    const queryClient = useQueryClient();
    const queryKey = [...queryKeys.courses.all, "evaluation-periods", courseId];
    const periodsQuery = useQuery({
        queryKey,
        queryFn: () => courseService.evaluationPeriods(courseId),
        meta: {errorMessage: "No se pudieron cargar los períodos de evaluación."},
    });
    const periods: EvaluationPeriod[] = periodsQuery.data ?? [];
    const [editing, setEditing] = useState<EvaluationPeriod | null>(null);
    const [creating, setCreating] = useState(false);
    const [busy, setBusy] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    const reload = () => void queryClient.invalidateQueries({queryKey});

    const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
        setBusy(true);
        try {
            await action();
            toast.success(success);
            reload();
        } catch (error) {
            toast.error(message(error, failure));
        } finally {
            setBusy(false);
        }
    };

    const generate = (count: number) => run(() => courseService.generateEvaluationPeriods(courseId, count),
        `Se crearon ${count} períodos de evaluación.`, "No se pudieron generar los períodos.");

    const copyToSections = async () => {
        setBusy(true);
        try {
            const sections = await courseService.copyEvaluationPeriods(courseId);
            toast.success(sections.length
                ? `Períodos copiados a ${sections.join(", ")}.`
                : "Las demás secciones ya tienen sus períodos.");
        } catch (error) {
            toast.error(message(error, "No se pudieron copiar los períodos."));
        } finally {
            setBusy(false);
        }
    };

    const remove = (period: EvaluationPeriod) => run(() => courseService.deleteEvaluationPeriod(courseId, period.id),
        `${period.code} eliminado.`, "No se pudo eliminar el período.").then(() => setConfirmDelete(null));

    const last = periods[periods.length - 1];

    return (
        <DetailSection
            title="Períodos de evaluación"
            description="Los profesores califican cada materia por período y publican las notas desde la app."
            actions={periods.length > 0 && <>
                {hasSections && (
                    <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void copyToSections()}>
                        <i className="fa fa-clone"/>Copiar a otras secciones
                    </button>
                )}
                <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => setCreating(true)}>
                    <i className="fa fa-plus"/>Agregar período
                </button>
            </>}
        >
            {periodsQuery.isLoading ? <LoadingContent loading className="py-12"/> : periods.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-[18px] border border-dashed px-6 py-10 text-center"
                     style={{borderColor: "var(--border-strong)", background: "var(--surface-muted)"}}>
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] text-xl"
                          style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                        <i className="fa fa-clipboard-check"/>
                    </span>
                    <div>
                        <strong className="block text-base" style={{color: "var(--text-primary)"}}>Este curso aún no tiene períodos</strong>
                        <p className="mt-1 max-w-md text-sm" style={{color: "var(--text-secondary)"}}>
                            Reparte el año escolar en períodos iguales con un clic, o créalos uno por uno con sus fechas.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {GENERATE_OPTIONS.map((count) => (
                            <button key={count} type="button" className="btn btn-sm" disabled={busy} onClick={() => void generate(count)}>
                                <i className="fa fa-wand-magic-sparkles"/>{count} períodos
                            </button>
                        ))}
                        <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => setCreating(true)}>
                            <i className="fa fa-plus"/>Crear manualmente
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <Timeline periods={periods}/>
                    <ol className="space-y-3">
                        {periods.map((period) => {
                            const style = STATE_STYLE[period.state];
                            const deletable = period.id === last?.id && !period.used;
                            return (
                                <li key={period.id} className="flex flex-wrap items-center gap-4 rounded-[16px] border p-4"
                                    style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-sm font-extrabold"
                                          style={{background: style.background, color: style.color}}>
                                        {period.code}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <strong className="text-sm" style={{color: "var(--text-primary)"}}>{period.name}</strong>
                                            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                                  style={{background: style.background, color: style.color}}>
                                                {EvaluationPeriodStateLabel[period.state]}
                                            </span>
                                            {period.used && (
                                                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                                      style={{background: "var(--surface-soft)", color: "var(--text-secondary)"}}>
                                                    <i className="fa fa-pen-to-square me-1"/>Con calificaciones
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>
                                            <i className="fa fa-calendar me-1.5 opacity-60"/>
                                            {formatDate(period.startsAt)} – {formatDate(period.endsAt)}
                                            <span className="ms-2 text-xs" style={{color: "var(--text-tertiary)"}}>
                                                · {daysBetween(period.startsAt, period.endsAt)} días
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button type="button" className="row-action" title="Editar" aria-label={`Editar ${period.code}`}
                                                disabled={busy} onClick={() => setEditing(period)}>
                                            <i className="fa fa-pen"/>
                                        </button>
                                        {deletable && (confirmDelete === period.id ? (
                                            <>
                                                <button type="button" className="btn btn-xs" disabled={busy} onClick={() => setConfirmDelete(null)}>
                                                    Cancelar
                                                </button>
                                                <button type="button" className="btn btn-xs btn-danger" disabled={busy} onClick={() => void remove(period)}>
                                                    <i className="fa fa-trash"/>Eliminar {period.code}
                                                </button>
                                            </>
                                        ) : (
                                            <button type="button" className="row-action" title="Eliminar" aria-label={`Eliminar ${period.code}`}
                                                    disabled={busy} onClick={() => setConfirmDelete(period.id)}>
                                                <i className="fa fa-trash"/>
                                            </button>
                                        ))}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                    <p className="text-xs" style={{color: "var(--text-tertiary)"}}>
                        <i className="fa fa-circle-info me-1"/>
                        Los períodos van uno detrás de otro. Solo se puede eliminar el último, y solo si aún no tiene calificaciones.
                    </p>
                </div>
            )}

            <PeriodFormModal
                open={creating || editing !== null}
                period={editing}
                nextSequence={(last?.sequence ?? 0) + 1}
                suggestedStart={last ? nextDay(last.endsAt) : undefined}
                onClose={() => {
                    setCreating(false);
                    setEditing(null);
                }}
                onSave={async (request) => {
                    if (editing) await courseService.updateEvaluationPeriod(courseId, editing.id, request);
                    else await courseService.createEvaluationPeriod(courseId, request);
                    reload();
                }}
            />
        </DetailSection>
    );
};

const nextDay = (value: string): string => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** Barra del año escolar con cada período a escala y el día de hoy marcado. */
const Timeline = ({periods}: { periods: EvaluationPeriod[] }) => {
    const start = periods[0].startsAt;
    const end = periods[periods.length - 1].endsAt;
    const total = daysBetween(start, end);
    const today = new Date().toISOString().slice(0, 10);
    const todayOffset = today >= start && today <= end ? (daysBetween(start, today) / total) * 100 : null;
    return (
        <div className="relative pt-6">
            {todayOffset !== null && (
                <span className="absolute top-0 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider"
                      style={{left: `${todayOffset}%`, color: "var(--accent)"}}>Hoy</span>
            )}
            <div className="flex h-3 overflow-hidden rounded-full" style={{background: "var(--surface-soft)"}}>
                {periods.map((period, index) => (
                    <div key={period.id} title={`${period.code} · ${period.name}`}
                         className={clsx(index > 0 && "border-l-2")}
                         style={{
                             width: `${(daysBetween(period.startsAt, period.endsAt) / total) * 100}%`,
                             background: STATE_STYLE[period.state].color,
                             opacity: period.state === "UPCOMING" ? 0.35 : 0.85,
                             borderColor: "var(--surface)",
                         }}/>
                ))}
            </div>
            {todayOffset !== null && (
                <span className="absolute top-[18px] h-5 w-0.5 -translate-x-1/2 rounded-full"
                      style={{left: `${todayOffset}%`, background: "var(--accent)"}}/>
            )}
            <div className="mt-2 flex text-[11px] font-semibold" style={{color: "var(--text-tertiary)"}}>
                {periods.map((period) => (
                    <span key={period.id} className="truncate text-center"
                          style={{width: `${(daysBetween(period.startsAt, period.endsAt) / total) * 100}%`}}>
                        {period.code}
                    </span>
                ))}
            </div>
        </div>
    );
};

const PeriodFormModal = ({open, period, nextSequence, suggestedStart, onClose, onSave}: {
    open: boolean;
    period: EvaluationPeriod | null;
    nextSequence: number;
    suggestedStart?: string;
    onClose: () => void;
    onSave: (request: EvaluationPeriodRequest) => Promise<void>;
}) => {
    const [name, setName] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(period?.name ?? "");
        setStartsAt(period?.startsAt ?? suggestedStart ?? "");
        setEndsAt(period?.endsAt ?? "");
    }, [period, suggestedStart, open]);

    const code = period?.code ?? `P${nextSequence}`;
    const valid = Boolean(startsAt && endsAt && endsAt >= startsAt);

    const submit = async () => {
        if (!valid) return;
        setSaving(true);
        try {
            await onSave({name: name.trim() || undefined, startsAt, endsAt});
            toast.success(period ? `${code} actualizado.` : `${code} creado.`);
            onClose();
        } catch (error) {
            toast.error(message(error, "No se pudo guardar el período."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <LeftModal title={period ? `Editar ${code}` : `Nuevo período ${code}`} isOpen={open} onClose={onClose}
                   className="h-full w-[min(520px,100vw)]">
            <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}>
                <div className="rounded-[18px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>{code}</div>
                    <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>
                        Debe empezar después de que termine el período anterior y quedar dentro del año escolar.
                    </p>
                </div>
                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Nombre</label>
                    <label className="input input-sm w-full">
                        <i className="fa fa-tag me-1"/>
                        <input maxLength={64} placeholder={`Período ${period?.sequence ?? nextSequence}`} value={name}
                               onChange={(event) => setName(event.target.value)}/>
                    </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <DatePicker label="Inicio*" value={startsAt} onChange={setStartsAt} required/>
                    <DatePicker label="Fin*" value={endsAt} min={startsAt || undefined} onChange={setEndsAt} required/>
                </div>
                <div className="mt-auto flex justify-end gap-2 border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                    <button type="button" className="btn btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !valid}>
                        <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{saving ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </form>
        </LeftModal>
    );
};
