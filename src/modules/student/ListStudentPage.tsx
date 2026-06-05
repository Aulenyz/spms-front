import { useEffect, useState } from "react";
import { KeyValueOf, State } from "../../domain/types/steoreotype.ts";
import { Link } from "react-router-dom";
import { StudentService } from "../../services/student/StudentService.ts";
import { Page, Pagination } from "../../domain/filters/Page.ts";
import { Student, StudentStatus } from "../../domain/student/Student.ts";
import { StudentGenderPill } from "../../components/io/output/pill/StudentGenderPill.tsx";
import { StudentStatusPill } from "../../components/io/output/pill/StudentStatusPill.tsx";
import { Pager } from "../../components/io/input/Pager.tsx";
import { StudentBreadcrumb } from "../breadcrumb/StudentBreadcrumb.tsx";
import { StudentFilter } from "../../domain/filters/student/StudentFilter.tsx";
import { PageHeader } from "../../components/ui/layout/PageHeader.tsx";
import { DataTableCard } from "../../components/ui/data/DataTableCard.tsx";
import { EmptyState } from "../../components/ui/feedback/EmptyState.tsx";
import { StudentModal } from "./RegisterStudentPage";

const studentService: StudentService = StudentService.instance;

export const ListStudentPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [students, setStudents]: State<Page<Student>> = useState(Pagination.empty<Student>());
    const [openModal, setOpenModal] = useState(false);

    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });

    useEffect(() => {
        studentService.getAll(filters, pagination).then(setStudents);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, page }));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({ ...prev, page: 0, size }));
    };

    const handleUpdateFilter = (nextFilters: KeyValueOf<string>) => {
        setFilters({ ...nextFilters });
        handlePageChange(0);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Listado de estudiantes"
                description="Consulta registro, genero y estado academico desde una sola vista."
            />

            <StudentBreadcrumb
                onRegisterClick={() => setOpenModal(true)}
            />
            <DataTableCard
                title="Estudiantes"
                description="Filtra el listado por estado y revisa la informacion principal de cada alumno."
                status={<StudentStatusPill status={filters.status as StudentStatus} />}
                filters={<StudentFilter onFilter={handleUpdateFilter} />}
                footer={
                    <Pager
                        onChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        page={students}
                    />
                }
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th>Documento</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Genero</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                    </thead>

                    <tbody>
                    {students.content.length === 0 && (
                        <tr>
                            <td colSpan={6}>
                                <EmptyState
                                    title="No hay estudiantes para mostrar"
                                    description="Prueba otros filtros para ver mas resultados."
                                    icon="fa-user-graduate"
                                />
                            </td>
                        </tr>
                    )}

                    {students.content.map((student: Student, index: number) => (
                        <tr key={index}>
                            <td>
                                <strong>{student.document}</strong>
                            </td>
                            <td>{student.firstname}</td>
                            <td>{student.lastname}</td>
                            <td>
                                <StudentGenderPill gender={student.gender} />
                            </td>
                            <td>
                                <StudentStatusPill status={student.status} />
                            </td>
                            <td className="text-right">
                                <Link
                                    to="#"
                                    className="table-link whitespace-nowrap"
                                >
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs" />
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>

            <StudentModal
                isOpen={openModal}
                onClose={() => setOpenModal(false)}
            />
        </div>
    );
};