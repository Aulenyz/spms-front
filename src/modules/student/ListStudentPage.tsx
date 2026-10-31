import {useCallback, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {TableDetailAction} from "../../components/ui/data/TableDetailAction.tsx";
import {StudentService} from "../../services/student/StudentService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Student, StudentStatus} from "../../domain/student/Student.ts";
import {StudentGenderPill} from "../../components/io/output/pill/StudentGenderPill.tsx";
import {StudentStatusPill} from "../../components/io/output/pill/StudentStatusPill.tsx";
import {Pager} from "../../components/io/input/Pager.tsx";
import {StudentBreadcrumb} from "../breadcrumb/StudentBreadcrumb.tsx";
import {StudentFilter} from "../../domain/filters/student/StudentFilter.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {StudentForm} from "./StudentForm.tsx";
import {queryKeys} from "../../app/query/queryKeys.ts";

const studentService: StudentService = StudentService.instance;
const EMPTY_PAGE: Page<Student> = Pagination.empty<Student>();

export const ListStudentPage = () => {
    const queryClient = useQueryClient();
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });
    const [showCreate, setShowCreate] = useState(false);

    const {data: students = EMPTY_PAGE} = useQuery({
        queryKey: queryKeys.students.list({filters, pagination}),
        queryFn: ({signal}) => studentService.withSignal(signal).getAll(filters, pagination),
        placeholderData: keepPreviousData,
    });

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleUpdateFilter = useCallback((nextFilters: KeyValueOf<string>) => {
        setFilters({...nextFilters});
        setPagination((prev) => ({...prev, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Listado de estudiantes"
                description="Consulta registro, género y estado académico desde una sola vista."
            />

            <StudentBreadcrumb onCreate={() => setShowCreate(true)}/>

            <DataTableCard
                title="Estudiantes"
                description="Filtra el listado por estado y revisa la información principal de cada alumno."
                status={<StudentStatusPill status={filters.status as StudentStatus}/>}
                filters={<StudentFilter onFilter={handleUpdateFilter}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={students}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Documento</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Apellido</th>
                        <th scope="col">Género</th>
                        <th scope="col">Estado</th>
                        <th scope="col"></th>
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

                    {students.content.map((student: Student) => (
                        <tr key={student.id}>
                            <td><strong>{student.document}</strong></td>
                            <td>{student.firstname}</td>
                            <td>{student.lastname}</td>
                            <td><StudentGenderPill gender={student.gender}/></td>
                            <td><StudentStatusPill status={student.status}/></td>
                            <td className="text-right">
                                <TableDetailAction disabled/>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>

            <LeftModal
                title="Registrar estudiante"
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <StudentForm
                    onDone={() => setShowCreate(false)}
                    onSaved={() => void queryClient.invalidateQueries({queryKey: queryKeys.students.all})}
                />
            </LeftModal>
        </div>
    );
};
