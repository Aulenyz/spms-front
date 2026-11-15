import {useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {Link} from "react-router-dom";

import {queryKeys} from "../../app/query/queryKeys.ts";
import {
    EvaluationPeriod,
    EvaluationPeriodRequest,
} from "../../domain/model/course/EvaluationPeriod.ts";
import {CourseService} from "../../services/course/CourseService.ts";
import {DetailSection} from "../../components/ui/detail/DetailSection.tsx";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {DatePicker} from "../../components/io/DatePicker.tsx";
import {PeriodList} from "../../components/ui/detail/PeriodList.tsx";

const courseService = CourseService.instance;

const GENERATE_OPTIONS = [2, 3, 4, 6];

const message = (error: unknown, fallback: string): string => {
    const text = typeof error === "object" && error !== null ? (error as { message?: unknown }).message : undefined;
    return typeof text === "string" && text.trim() ? text : fallback;
};

const formatDate = (value: string): string => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es", {day: "numeric", month: "short", year: "numeric"});
};

const toDate = (value: string): Date => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
};

const daysBetween = (from: string, to: string): number =>
    Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1);

/**
 * Períodos de evaluación del curso (P1, P2...): los profesores califican cada materia por período y publican
 * desde la app. Son sucesivos y van dentro del año escolar.
 */
export const CourseEvaluationPeriods = ({courseId, templateId}: { courseId: string; templateId?: number | null }) => {
    /** Un curso generado desde un curso base no define sus períodos: vienen de allá. */
    const managed = Boolean(templateId);
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

    const remove = (period: EvaluationPeriod) => run(() => courseService.deleteEvaluationPeriod(courseId, period.id),
        `${period.code} eliminado.`, "No se pudo eliminar el período.").then(() => setConfirmDelete(null));

    const last = periods[periods.length - 1];

    return (
        <DetailSection
            title="Períodos de evaluación"
            description={managed
                ? "Vienen del curso base cada vez que se genera o actualiza el curso. Los que ya pasaron no se pueden cambiar."
                : "Defínelos aquí, o genera un curso base para que sus cursos nazcan con ellos. Los profesores califican y publican desde la app."}
            actions={managed && templateId ? (
                <Link to={`/courses/templates/${templateId}`} className="btn btn-sm">
                    <i className="fa fa-layer-group"/>Ver curso base
                </Link>
            ) : periods.length > 0 && (
                <button type="button" className="btn btn-sm btn-primary" disabled={busy} onClick={() => setCreating(true)}>
                    <i className="fa fa-plus"/>Agregar período
                </button>
            )}
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
                            {managed
                                ? "Defínelos en el curso base y usa \"Generar o actualizar curso\": llegan a todas sus secciones."
                                : "Reparte el año con un clic o créalos uno por uno."}
                        </p>
                    </div>
                    {!managed && (
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
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <PeriodList rows={periods.map((period, index) => {
                        const ended = period.state === "ENDED";
                        const extendable = ended && period.extendable === true;
                        const deletable = !managed && period.id === last?.id && !period.used && !ended;
                        const next = periods[index + 1];
                        return {
                            key: period.id,
                            code: period.code,
                            name: period.name,
                            start: toDate(period.startsAt),
                            end: toDate(period.endsAt),
                            days: daysBetween(period.startsAt, period.endsAt),
                            badges: <>
                                {period.used && (
                                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                          style={{background: "var(--surface)", color: "var(--text-secondary)"}}>
                                        <i className="fa fa-pen-to-square me-1"/>Con calificaciones
                                    </span>
                                )}
                                {next !== undefined && period.endsAt >= next.startsAt && (
                                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                                          style={{background: "var(--warning-soft)", color: "var(--warning)"}}>
                                        <i className="fa fa-arrows-left-right me-1"/>Se cruza con {next.code}
                                    </span>
                                )}
                            </>,
                            actions: <>
                                {ended && !extendable ? (
                                    <span className="row-action cursor-not-allowed opacity-50" role="img"
                                          title="Ya pasó: no se puede editar" aria-label={`${period.code} ya pasó: no se puede editar`}>
                                        <i className="fa fa-lock"/>
                                    </span>
                                ) : extendable ? (
                                    <button type="button" className="btn btn-xs" disabled={busy} onClick={() => setEditing(period)}
                                            title="Extender el fin, por si se alargan los días" aria-label={`Extender el fin de ${period.code}`}>
                                        <i className="fa fa-calendar-plus"/>Extender
                                    </button>
                                ) : !managed && (
                                    <button type="button" className="row-action" title="Editar" aria-label={`Editar ${period.code}`}
                                            disabled={busy} onClick={() => setEditing(period)}>
                                        <i className="fa fa-pen"/>
                                    </button>
                                )}
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
                            </>,
                        };
                    })}/>
                    <p className="text-xs" style={{color: "var(--text-tertiary)"}}>
                        <i className="fa fa-circle-info me-1"/>
                        {managed
                            ? "Los períodos se cambian en el curso base. Los que ya pasaron no se pueden editar; solo el último con calificaciones puede extender su fin, aunque se cruce con el siguiente."
                            : "Los períodos van uno detrás de otro. Los que ya pasaron no se pueden editar; solo el último con calificaciones puede extender su fin. Solo se puede eliminar el último, y solo si aún no terminó ni tiene calificaciones."}
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
    /** Un período que ya terminó solo puede extender su fin (la API lo exige). */
    const extending = period?.state === "ENDED";
    const valid = Boolean(startsAt && endsAt && endsAt >= startsAt && (!extending || endsAt > period.endsAt));

    const submit = async () => {
        if (!valid) return;
        setSaving(true);
        try {
            await onSave({name: name.trim() || undefined, startsAt, endsAt});
            toast.success(extending ? `${code} extendido hasta el ${formatDate(endsAt)}.` : period ? `${code} actualizado.` : `${code} creado.`);
            onClose();
        } catch (error) {
            toast.error(message(error, "No se pudo guardar el período."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <LeftModal title={extending ? `Extender ${code}` : period ? `Editar ${code}` : `Nuevo período ${code}`} isOpen={open} onClose={onClose}
                   className="h-full w-[min(520px,100vw)]">
            <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}>
                <div className="rounded-[18px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>{code}</div>
                    <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>
                        {extending
                            ? "Este período ya terminó, así que solo puedes extender su fecha de fin, por si se alargan los días. Puede cruzarse con el período siguiente."
                            : "Debe empezar después de que termine el período anterior y quedar dentro del año escolar."}
                    </p>
                </div>
                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Nombre</label>
                    <label className="input input-sm w-full">
                        <i className="fa fa-tag me-1"/>
                        <input maxLength={64} placeholder={`Período ${period?.sequence ?? nextSequence}`} value={name} disabled={extending}
                               onChange={(event) => setName(event.target.value)}/>
                    </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <DatePicker label="Inicio*" value={startsAt} onChange={setStartsAt} required disabled={extending}/>
                    <DatePicker label="Fin*" value={endsAt} min={(extending ? nextDay(period.endsAt) : startsAt) || undefined}
                                onChange={setEndsAt} required/>
                </div>
                <div className="mt-auto flex justify-end gap-2 border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                    <button type="button" className="btn btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !valid}>
                        <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>{saving ? "Guardando..." : extending ? "Extender" : "Guardar"}
                    </button>
                </div>
            </form>
        </LeftModal>
    );
};
