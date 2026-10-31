export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
export const DayShort: Record<DayOfWeek, string> = {
    MONDAY: "Lun", TUESDAY: "Mar", WEDNESDAY: "Mié", THURSDAY: "Jue", FRIDAY: "Vie", SATURDAY: "Sáb", SUNDAY: "Dom",
};

export type TemplateSlot = {dayOfWeek: DayOfWeek; startsAt: string; endsAt: string};

/** Secciones de una plantilla con el mismo nombre que los cursos generados: A, B, C... */
export const divisionsOf = (count?: number) =>
    Array.from({length: Math.max(count ?? 0, 0)}, (_, index) => index < 26 ? String.fromCharCode(65 + index) : String(index + 1));

/** "08:00:00" → "08:00" */
export const hhmm = (time: string) => time.slice(0, 5);

const minutesOf = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
};

export const sortSlots = <T extends TemplateSlot>(slots: T[]) => [...slots].sort((a, b) =>
    DAYS.indexOf(a.dayOfWeek) - DAYS.indexOf(b.dayOfWeek) || minutesOf(a.startsAt) - minutesOf(b.startsAt));

/** Agrupa los días que comparten horario: "Lun, Mié · 08:00–09:30". */
export const describeSlots = (slots: TemplateSlot[]) => {
    const groups = new Map<string, DayOfWeek[]>();
    sortSlots(slots).forEach((slot) => {
        const key = `${hhmm(slot.startsAt)}–${hhmm(slot.endsAt)}`;
        groups.set(key, [...(groups.get(key) ?? []), slot.dayOfWeek]);
    });
    return [...groups.entries()].map(([time, days]) => `${days.map((day) => DayShort[day]).join(", ")} · ${time}`);
};
