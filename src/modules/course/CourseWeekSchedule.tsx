import {CourseAcademicAssignment} from "../../domain/model/course/Course.ts";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {PermittedLink} from "../../components/auth/PermittedLink.tsx";
import {buildScheduleGrid} from "./scheduleGrid.ts";
import {DayLabel} from "./template/schedule.ts";

/**
 * Semana del curso con el mismo diseño que el horario exportado: una fila por franja horaria y una columna por día,
 * con cada materia en su color, la hora a la izquierda y el profesor (con enlace a su detalle) en cada casilla.
 */
export const CourseWeekSchedule = ({assignments}: {assignments: CourseAcademicAssignment[]}) => {
    const grid = buildScheduleGrid(assignments);
    if (!grid) return null;
    const {days, rows} = grid;
    const columns = `112px repeat(${days.length}, minmax(0, 1fr))`;

    return (
        <div className="overflow-x-auto p-4">
            <div className="min-w-[760px]">
                <div className="grid items-center rounded-xl text-center text-xs font-bold uppercase tracking-[0.06em] text-white"
                     style={{gridTemplateColumns: columns, background: "#1f2544", minHeight: 44}}>
                    <span>Hora</span>
                    {days.map((day) => <span key={day}>{DayLabel[day]}</span>)}
                </div>

                {rows.map((row, rowIndex) => (
                    <div key={row.time} className="grid border-b"
                         style={{gridTemplateColumns: columns, borderColor: "var(--border-soft)",
                             background: rowIndex % 2 === 0 ? "var(--surface-muted)" : "var(--surface)"}}>
                        <span className="flex items-center justify-center px-2 text-sm font-bold" style={{color: "var(--text-primary)"}}>
                            {row.time}
                        </span>
                        {days.map((day) => {
                            const blocks = row.cells.get(day) ?? [];
                            return (
                                <div key={day} className="flex min-w-0 flex-col gap-1.5 p-1.5">
                                    {blocks.map((block, index) => (
                                        <div key={`${block.assignment.id}-${index}`}
                                             className="flex min-h-[64px] flex-1 flex-col justify-center rounded-[10px] px-3 py-2"
                                             style={{background: block.color.fill, borderLeft: `5px solid ${block.color.edge}`}}>
                                            <p className="line-clamp-2 text-sm font-bold leading-tight" style={{color: "#111827"}}>{block.subject}</p>
                                            <p className="mt-0.5 truncate text-xs" style={{color: "#374151"}}>
                                                {block.assignment.teacher
                                                    ? <PermittedLink authority={AuthorityKey.USER_DETAILS_VIEW} to={`/users/${block.assignment.teacher.id}`}
                                                                     className="hover:underline">{block.assignment.teacher.name}</PermittedLink>
                                                    : block.teacher}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
