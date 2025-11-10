import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {StudentService} from "../../services/student/StudentService";
import {State} from "../../domain/types/steoreotype.ts";
import {statusColors, StudentStatus, StudentStatusLabel} from "../../domain/student/Student.ts";

const studentService: StudentService = StudentService.instance;

export const StudentBreadcrumb = () => {

    const [status, setStatus]: State<Record<StudentStatus, number>> = useState<Record<StudentStatus, number>>({} as Record<StudentStatus, number>)

    useEffect(() => {
        studentService.getTotalByStatus().then(setStatus)
    }, []);

    return (
        <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
                <h1 className="text-xl font-medium leading-none text-gray-900">
                    Listado de Estudiantes
                </h1>
                <div className="flex items-center flex-wrap gap-2 font-medium">
                    {Object.keys(status).map((value: string, index: number) => {
                        const key = value as keyof typeof StudentStatus;
                        const colorClass = statusColors[key] || "bg-gray-100 text-gray-700 border-gray-300";
                        return (
                            <div
                                key={index}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full border ${colorClass}`}
                            >
                                <span className="text-sm font-medium">
                                    {StudentStatusLabel[key]}:
                                </span>
                                <span className="text-sm font-semibold">
                                    {status[key]}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                <Link className="btn btn-sm btn-light" to="#">
                    <i className="fa fa-upload me-1"/>
                    Carga Masiva
                </Link>
                <a className="btn btn-sm btn-primary" href="#">
                    <i className="fa fa-user-plus me-1"/>
                    Registrar
                </a>
            </div>
        </div>
    )
}
