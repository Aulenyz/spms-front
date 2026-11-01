import {CourseAcademicAssignment} from "../../domain/model/course/Course.ts";
import {DAYS, DayLabel, hhmm, sortSlots} from "./template/schedule.ts";

/** Semana del curso: una columna por día con sus clases en orden (materia, hora y profesor). */
export const CourseWeekSchedule = ({assignments}: {assignments: CourseAcademicAssignment[]}) => {
    const classes = sortSlots(assignments.flatMap((assignment) =>
        (assignment.slots ?? []).map((slot) => ({...slot, assignment}))));
    const days = DAYS.filter((day, index) => index < 5 || classes.some((item) => item.dayOfWeek === day));

    return (
        <div className="overflow-x-auto">
            <div className="grid min-w-[720px] gap-px" style={{gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, background: "var(--border-soft)"}}>
                {days.map((day) => {
                    const dayClasses = classes.filter((item) => item.dayOfWeek === day);
                    return (
                        <div key={day} className="min-h-[180px] p-2" style={{background: "var(--surface)"}}>
                            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.06em]" style={{color: "var(--text-tertiary)"}}>{DayLabel[day]}</p>
                            <div className="space-y-1.5">
                                {dayClasses.length === 0 ? (
                                    <p className="px-1 text-xs" style={{color: "var(--text-tertiary)"}}>Libre</p>
                                ) : dayClasses.map((item, index) => (
                                    <div key={`${item.assignment.id}-${index}`} className="rounded-xl border-l-4 px-2.5 py-2"
                                         style={{borderColor: "var(--accent)", background: "var(--accent-soft)"}}>
                                        <p className="text-[11px] font-semibold" style={{color: "var(--accent)"}}>
                                            {hhmm(item.startsAt)}–{hhmm(item.endsAt)}
                                        </p>
                                        <p className="truncate text-sm font-bold" style={{color: "var(--text-primary)"}}>{item.assignment.subject?.name}</p>
                                        <p className="truncate text-xs" style={{color: "var(--text-secondary)"}}>{item.assignment.teacher?.name ?? "Sin profesor"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
