import {CourseAcademicAssignment} from "../../domain/model/course/Course.ts";
import {DAYS, DayOfWeek, hhmm} from "./template/schedule.ts";

/** Un color por materia, legible también impreso en blanco y negro. */
export const SCHEDULE_PALETTE = [
    {fill: "#e0e7ff", edge: "#4f46e5"}, {fill: "#d1fae5", edge: "#059669"}, {fill: "#fef3c7", edge: "#d97706"},
    {fill: "#fee2e2", edge: "#dc2626"}, {fill: "#cffafe", edge: "#0891b2"}, {fill: "#fae8ff", edge: "#a21caf"},
    {fill: "#ffedd5", edge: "#ea580c"}, {fill: "#e2e8f0", edge: "#475569"},
];

export type ScheduleBlock = {
    assignment: CourseAcademicAssignment;
    subject: string;
    teacher: string;
    color: typeof SCHEDULE_PALETTE[number];
};
/** Una franja horaria ("09:00–10:00") con las clases de cada día. */
export type ScheduleRow = { time: string; cells: Map<DayOfWeek, ScheduleBlock[]> };
export type ScheduleGrid = { days: DayOfWeek[]; rows: ScheduleRow[] };

/**
 * Arma el horario semanal del curso como tabla: una fila por franja horaria y una columna por día (de lunes a
 * viernes, más sábado o domingo si hay clases). La usan la pantalla y la exportación para verse igual.
 * Devuelve null si el curso no tiene clases.
 */
export const buildScheduleGrid = (assignments: CourseAcademicAssignment[]): ScheduleGrid | null => {
    const slots = assignments.flatMap((assignment) => (assignment.slots ?? []).map((slot) => ({slot, assignment})));
    if (slots.length === 0) return null;

    const subjects = [...new Set(assignments.map((assignment) => assignment.subject?.name ?? ""))].sort((a, b) => a.localeCompare(b, "es"));
    const days = DAYS.filter((day, index) => index < 5 || slots.some(({slot}) => slot.dayOfWeek === day));

    const grouped = new Map<string, ScheduleRow>();
    slots.forEach(({slot, assignment}) => {
        const time = `${hhmm(slot.startsAt)}–${hhmm(slot.endsAt)}`;
        const row = grouped.get(time) ?? {time, cells: new Map<DayOfWeek, ScheduleBlock[]>()};
        grouped.set(time, row);
        const name = assignment.subject?.name ?? "Materia";
        row.cells.set(slot.dayOfWeek, [...(row.cells.get(slot.dayOfWeek) ?? []), {
            assignment,
            subject: name,
            teacher: assignment.teacher?.name ?? "Sin profesor",
            color: SCHEDULE_PALETTE[Math.max(subjects.indexOf(name), 0) % SCHEDULE_PALETTE.length],
        }]);
    });
    return {days, rows: [...grouped.values()].sort((a, b) => a.time.localeCompare(b.time))};
};
