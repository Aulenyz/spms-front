import {Link} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {StudentService} from "../../services/student/StudentService";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {statusColors, StudentStatus, StudentStatusLabel} from "../../domain/student/Student.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";


const studentService: StudentService = StudentService.instance;

const EMPTY_TOTALS = {} as Record<StudentStatus, number>;

export const StudentBreadcrumb = ({onCreate}: { onCreate?: () => void }) => {
    const {hasAuthority} = useAuthContext();
    const {data: status = EMPTY_TOTALS} = useQuery({
        queryKey: queryKeys.students.totals,
        queryFn: ({signal}) => studentService.withSignal(signal).getTotalByStatus(),
    });

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
            style={{
                borderColor: "var(--border-soft)",
                background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                {Object.keys(status).map((value: string) => {
                    const key = value as keyof typeof StudentStatus;
                    const colorClass = statusColors[key] || "bg-gray-100 text-gray-700 border-gray-300";
                    return (
                        <div
                            key={value}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${colorClass}`}
                        >
                            <span className="text-sm font-medium">{StudentStatusLabel[key]}:</span>
                            <span className="text-sm font-semibold">{status[key]}</span>
                        </div>
                    );
                })}
            </div>

            {hasAuthority(AuthorityKey.STUDENT_CREATE) && (
                <div className="flex items-center gap-2">
                    <Link className="btn btn-sm btn-light" to="/students/bulk-upload">
                        <i className="fa fa-upload me-1"/>
                        Carga masiva
                    </Link>
                    <button className="btn btn-sm btn-primary" type="button" onClick={onCreate}>
                        <i className="fa fa-user-plus me-1"/>
                        Registrar
                    </button>
                </div>
            )}
        </div>
    );
};
