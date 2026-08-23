import {useEffect, useMemo, useRef, useState} from "react";
import {toast} from "react-toastify";
import {TeacherClass, TeacherScheduleSlot, TeacherService} from "../../services/teacher/TeacherService.ts";
import {WeekDay, WeekDayLabel} from "../../domain/model/course/Course.ts";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {formatTime12, formatTimeRange12, timeInputValue} from "../../utils/timeFormat.ts";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";

const service = TeacherService.instance;
const days: WeekDay[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const slotKey = (item: TeacherClass, slot: TeacherScheduleSlot) => `${item.id}-${slot.id ?? `${slot.dayOfWeek}-${slot.startsAt}-${slot.endsAt}`}`;
const minutes = (value: string) => {
    const [hours = "0", mins = "0"] = timeInputValue(value).split(":");
    return Number(hours) * 60 + Number(mins);
};
const dayNumber = (day: WeekDay) => days.indexOf(day) + 1;
const message = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message : fallback;
const startOfWeek = (date: Date) => {
    const next = new Date(date);
    const day = next.getDay() || 7;
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() - day + 1);
    return next;
};
const addDays = (date: Date, amount: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};
const formatDate = (date: Date) => new Intl.DateTimeFormat("es-DO", {day: "2-digit", month: "short"}).format(date);
const weekRange = (weekStart: Date) => `${formatDate(weekStart)} - ${formatDate(addDays(weekStart, 4))}`;

export const TeacherWorkloadPage = () => {
    const [items, setItems] = useState<TeacherClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [now, setNow] = useState(new Date());
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    useEffect(() => {
        setLoading(true);
        service.schedule().then(setItems, (error) => toast.error(message(error, "No se pudo cargar tu horario docente.")))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(interval);
    }, []);

    const scheduleRows = useMemo(() => Array.from(new Set(items.flatMap((item) =>
        item.schedule.map((slot) => timeInputValue(slot.startsAt))))).sort(), [items]);
    const nextSlotKey = useMemo(() => {
        const currentDay = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        return items.flatMap((item) => item.schedule.map((slot) => ({item, slot})))
            .map((entry) => {
                let deltaDays = dayNumber(entry.slot.dayOfWeek) - currentDay;
                if (deltaDays < 0 || (deltaDays === 0 && minutes(entry.slot.startsAt) < currentMinutes)) deltaDays += 7;
                return {key: slotKey(entry.item, entry.slot), distance: deltaDays * 1440 + minutes(entry.slot.startsAt) - currentMinutes};
            })
            .sort((left, right) => left.distance - right.distance)[0]?.key;
    }, [items, now]);

    const exportSchedule = async () => {
        setExporting(true);
        try {
            await service.exportSchedule();
        } catch (error) {
            toast.error(message(error, "No se pudo exportar el horario semanal."));
        } finally {
            setExporting(false);
        }
    };

    if (!loading && !items.length) return <EmptyState title="Sin clases asignadas"
                                                      description="Cuando te asignen cursos y horarios aparecerán aquí."
                                                      icon="fa-chalkboard-teacher"/>;

    return <div className="space-y-6">
        <PageHeader
            title="Mi horario"
            description="Consulta tus clases asignadas por semana y el bloque que corresponde en cada día."
            actions={<button type="button" className="btn btn-sm bg-[var(--danger)] text-white" disabled={exporting}
                             onClick={() => void exportSchedule()}>
                <i className={exporting ? "fa fa-spinner fa-spin me-1" : "fa fa-file-pdf me-1"}/>
                {exporting ? "Exportando..." : "Exportar PDF"}
            </button>}
        />
        <TeacherScheduleGrid
            items={items}
            scheduleRows={scheduleRows}
            now={now}
            nextSlotKey={nextSlotKey}
            weekStart={weekStart}
            onPreviousWeek={() => setWeekStart((current) => addDays(current, -7))}
            onCurrentWeek={() => setWeekStart(startOfWeek(new Date()))}
            onNextWeek={() => setWeekStart((current) => addDays(current, 7))}
        />
    </div>;
};

const slotStatus = (slot: TeacherScheduleSlot, now: Date, key: string, nextKey?: string) => {
    const today = now.getDay();
    const start = minutes(slot.startsAt);
    const end = minutes(slot.endsAt);
    const current = now.getHours() * 60 + now.getMinutes();
    const slotDay = dayNumber(slot.dayOfWeek);
    if (slotDay === today && start <= current && current < end) return "current";
    if ((today >= 1 && today <= 6) && (slotDay < today || (slotDay === today && end <= current))) return "past";
    if (key === nextKey) return "next";
    return "future";
};

const TeacherScheduleGrid = ({items, scheduleRows, now, nextSlotKey, weekStart, onPreviousWeek, onCurrentWeek, onNextWeek}: {
    items: TeacherClass[];
    scheduleRows: string[];
    now: Date;
    nextSlotKey?: string;
    weekStart: Date;
    onPreviousWeek: () => void;
    onCurrentWeek: () => void;
    onNextWeek: () => void;
}) => {
    const currentRef = useRef<HTMLElement | null>(null);
    const nextRef = useRef<HTMLElement | null>(null);
    const isCurrentWeek = startOfWeek(now).getTime() === weekStart.getTime();
    const weekDays = days.map((day, index) => ({day, date: addDays(weekStart, index)}));

    useEffect(() => {
        if (!isCurrentWeek) return;
        const target = currentRef.current ?? nextRef.current;
        window.setTimeout(() => target?.scrollIntoView({block: "center", behavior: "smooth"}), 150);
    }, [isCurrentWeek, nextSlotKey, scheduleRows.length]);

    return <section className="rounded-[26px] border p-5" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
             style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
            <div>
                <strong className="text-sm">Horario semanal</strong>
                <p className="mt-1 text-xs" style={{color: "var(--text-secondary)"}}>{weekRange(weekStart)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="btn btn-sm" onClick={onPreviousWeek}><i className="fa fa-chevron-left me-1"/>Anterior</button>
                <button type="button" className="btn btn-sm" onClick={onCurrentWeek}>Esta semana</button>
                <button type="button" className="btn btn-sm" onClick={onNextWeek}>Siguiente<i className="fa fa-chevron-right ms-1"/></button>
            </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border" style={{borderColor: "var(--border-soft)", boxShadow: "var(--shadow-soft)"}}>
            <div className="min-w-[980px]">
                <div className="grid grid-cols-[78px_repeat(5,minmax(170px,1fr))] border-b" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                    <div className="flex items-center justify-center border-r text-[10px] font-extrabold uppercase tracking-wider" style={{borderColor: "var(--border-soft)", color: "var(--text-tertiary)"}}>Hora</div>
                    {weekDays.map(({day, date}) => <div key={day} className="border-r px-3 py-3 text-center last:border-r-0" style={{borderColor: "var(--border-soft)"}}>
                        <strong className="block text-sm">{WeekDayLabel[day]}</strong>
                        <span className="mt-1 block text-[11px] font-bold" style={{color: "var(--text-secondary)"}}>{formatDate(date)}</span>
                    </div>)}
                </div>
                {scheduleRows.map((rowTime) => <div key={rowTime} className="grid min-h-[96px] grid-cols-[78px_repeat(5,minmax(170px,1fr))] border-b last:border-b-0" style={{borderColor: "var(--border-soft)"}}>
                    <div className="border-r px-2 pt-4 text-center text-xs font-extrabold leading-tight" style={{borderColor: "var(--border-soft)", color: "var(--text-secondary)", background: "var(--surface-muted)"}}>{formatTime12(rowTime)}</div>
                    {weekDays.map(({day}) => <div key={day} className="space-y-2 border-r p-2 last:border-r-0" style={{borderColor: "var(--border-soft)"}}>
                        {items.flatMap((item) => item.schedule.filter((slot) => slot.dayOfWeek === day && timeInputValue(slot.startsAt) === rowTime).map((slot) => ({item, slot}))).map(({item, slot}) => {
                            const key = slotKey(item, slot);
                            const status = isCurrentWeek ? slotStatus(slot, now, key, nextSlotKey) : "future";
                            const isPast = status === "past";
                            const isCurrent = status === "current";
                            const isNext = status === "next";
                            return <article key={key}
                                            ref={(element) => {
                                                if (isCurrent) currentRef.current = element;
                                                if (isNext) nextRef.current = element;
                                            }}
                                            className={`relative overflow-hidden rounded-xl border p-3 pl-4 ${isPast ? "opacity-55" : ""} ${isCurrent ? "ring-2 ring-[var(--accent)]" : ""}`}
                                            style={{borderColor: isCurrent ? "var(--accent)" : isNext ? "color-mix(in srgb, #f59e0b 55%, var(--border-soft))" : "color-mix(in srgb, var(--accent) 24%, var(--border-soft))", background: isCurrent ? "color-mix(in srgb, var(--accent) 14%, var(--surface))" : isNext ? "color-mix(in srgb, #f59e0b 12%, var(--surface))" : "color-mix(in srgb, var(--accent) 6%, var(--surface))"}}>
                                <span className="absolute inset-y-0 left-0 w-1" style={{background: isNext ? "#f59e0b" : "var(--accent)"}}/>
                                {isPast && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[10px] text-red-600"><i className="fa fa-xmark"/></span>}
                                {(isCurrent || isNext) && <span className="mb-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide" style={{background: isCurrent ? "var(--accent)" : "#f59e0b", color: "white"}}>{isCurrent ? "Ahora" : "Siguiente"}</span>}
                                <div className="flex items-start justify-between gap-2">
                                    <strong className="truncate pr-5 text-xs">{item.subject.name}</strong>
                                    <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>{item.division}</span>
                                </div>
                                <p className="mt-1 text-[11px] font-bold" style={{color: isNext ? "#b45309" : "var(--accent)"}}>{formatTimeRange12(slot.startsAt, slot.endsAt, " — ")}</p>
                                <p className="mt-1 truncate text-[11px]" style={{color: "var(--text-secondary)"}}>{item.courseName}</p>
                            </article>;
                        })}
                    </div>)}
                </div>)}
                {!scheduleRows.length && <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{background: "var(--accent-soft)", color: "var(--accent)"}}><i className="fa fa-calendar-day"/></span>
                    <strong>No hay clases programadas</strong>
                    <p className="mt-1 max-w-sm text-sm" style={{color: "var(--text-secondary)"}}>Tus bloques asignados aparecerán aquí cuando tengas horario activo.</p>
                </div>}
            </div>
        </div>
    </section>;
};
