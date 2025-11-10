import {useEffect, useState} from "react";
import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {Link} from "react-router-dom";
import {StudentService} from "../../services/student/StudentService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Student, StudentStatus} from "../../domain/student/Student.ts";
import {StudentGenderPill} from "../../components/io/output/pill/StudentGenderPill.tsx";
import {StudentStatusPill} from "../../components/io/output/pill/StudentStatusPill.tsx";
import {Pager} from "../../components/io/input/Pager.tsx";
import {StudentBreadcrumb} from "../breadcrumb/StudentBreadcrumb.tsx";
import {StudentFilter} from "../../domain/filters/student/StudentFilter.tsx";

const studentService: StudentService = StudentService.instance;

export const ListStudentPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [students, setStudents]: State<Page<Student>> = useState(Pagination.empty<Student>());
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });

    useEffect(() => {
        studentService.getAll(filters, pagination).then(setStudents);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleUpdateFilter = (filters: KeyValueOf<string>) => {
        setFilters({...filters});
        handlePageChange(0);
    };

    return (
        <div className="pt-6 pl-9 pr-5">
            <div>
                <StudentBreadcrumb/>
            </div>

            <div className="card relative overflow-x-auto mb-6 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Mostrando Estudiantes:</span>
                        <StudentStatusPill status={filters.status as StudentStatus}/>
                    </h3>
                    <StudentFilter onFilter={handleUpdateFilter}/>
                </div>

                {/* 🔹 Tabla (idéntico estilo que la de empleados) */}
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Estudiante</th>
                        <th scope="col" className="px-6 py-3">Nombre</th>
                        <th scope="col" className="px-6 py-3">Apellido</th>
                        <th scope="col" className="px-6 py-3">Género</th>
                        <th scope="col" className="px-6 py-3">Estatus</th>
                        <th scope="col" className="px-3 py-3 w-[5%]"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {students.content.map((student: Student, index: number) => (
                        <tr key={index}
                            className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                            <td className="px-6 py-3">
                                {student.document}
                            </td>
                            <td className="px-6 py-3">{student.firstname}</td>
                            <td className="px-6 py-3">{student.lastname}</td>
                            <td className="px-6 py-3">
                                <StudentGenderPill gender={student.gender}/>
                            </td>
                            <td className="px-6 py-3">
                                <StudentStatusPill status={student.status}/>
                            </td>
                            <td className="px-3 py-3 text-right">
                                <Link to="#" className="font-medium text-blue-600 hover:underline whitespace-nowrap">
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs ms-1"/>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div>
                    <Pager onChange={handlePageChange} page={students}/>
                </div>
            </div>
        </div>
    );
};
