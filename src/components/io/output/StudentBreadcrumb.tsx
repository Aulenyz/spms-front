import {useEffect, useState} from "react";
import {State} from "../../../domain/types/steoreotype.ts";
import {Link} from "react-router-dom";
import {StudentService} from "../../../services/student/StudentService.ts";
import {StudentStatus, StudentStatusLabel} from "../../../domain/student/Student.ts";

const studentService: StudentService = StudentService.instance;

export const StudentBreadcrumb = () => {

    const [status, setStatus]: State<Record<StudentStatus, number>> = useState<Record<StudentStatus, number>>({} as Record<StudentStatus, number>)

    useEffect(() => {
        studentService.getTotalByStatus().then(setStatus)
    }, []);

    return (
        <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
                <h1 className="text-xl font-medium leading-none text-gray-900">Listado de Estudiantes</h1>
                <div className="flex items-center flex-wrap gap-1.5 font-medium">
                    {Object.keys(status).map((value: string, index: number) => {
                        return (
                            <div key={index}>
                                <span
                                    className="text-md text-gray-600 me-1">{StudentStatusLabel[value as keyof typeof StudentStatus]}:</span>
                                <span
                                    className="text-md gray-800 font-semibold me-2">{status[value as keyof typeof StudentStatus]}</span>
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