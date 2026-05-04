import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {StudentService} from "../../services/student/StudentService";
import {State} from "../../domain/types/steoreotype.ts";
import {statusColors, StudentStatus, StudentStatusLabel} from "../../domain/student/Student.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

const studentService: StudentService = StudentService.instance;

export const StudentBreadcrumb = () => {
    const {hasAuthority} = useAuthContext();
    const [status, setStatus]: State<Record<StudentStatus, number>> = useState<Record<StudentStatus, number>>({} as Record<StudentStatus, number>);

    useEffect(() => {
        studentService.getTotalByStatus().then(setStatus);
    }, []);

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
                {Object.keys(status).map((value: string, index: number) => {
                    const key = value as keyof typeof StudentStatus;
                    const colorClass = statusColors[key] || "bg-gray-100 text-gray-700 border-gray-300";
                    return (
                        <div
                            key={index}
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
                    <Link className="btn btn-sm btn-light" to="#">
                        <i className="fa fa-upload me-1"/>
                        Carga masiva
                    </Link>
                    <a className="btn btn-sm btn-primary" href="#">
                        <i className="fa fa-user-plus me-1"/>
                        Registrar
                    </a>
                </div>
            )}
        </div>
    );
};
