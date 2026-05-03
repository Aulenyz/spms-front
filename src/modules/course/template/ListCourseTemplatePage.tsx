import {useEffect, useState} from "react";
import {useNavigate, useOutletContext} from "react-router-dom";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {CourseTemplate, GradeTypeLabel} from "../../../domain/model/course/Course.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {CourseTemplateFilter} from "../../../domain/filters/course/CourseTemplateFilter.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";

const courseTemplateService: CourseTemplateService = CourseTemplateService.instance;

export const ListCourseTemplatePage = () => {
    const navigate = useNavigate();
    const {courseTemplateBump} = useOutletContext<{courseTemplateBump: number}>();
    const [pagination, setPagination] = useState(Pagination.first);
    const [filters, setFilters] = useState<Record<string, any>>({
        name: "",
        type: "",
    });
    const [courseTemplates, setCourseTemplates] = useState<Page<CourseTemplate>>(Pagination.empty<CourseTemplate>());

    useEffect(() => {
        courseTemplateService.getAll(filters, pagination).then(setCourseTemplates);
    }, [pagination, filters, courseTemplateBump]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleFilters = (nextFilters: Record<string, any>) => {
        setFilters(nextFilters);
        setPagination((prev) => ({...prev, page: 0}));
    };

    return (
        <DataTableCard
            title="Plantillas de cursos"
            description="Consulta las plantillas base usadas para organizar cursos, niveles y estructuras academicas."
            status={<span className="page-header-eyebrow">Registros: {courseTemplates.content.length}</span>}
            filters={<CourseTemplateFilter onFilter={handleFilters}/>}
            footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={courseTemplates}/>}
        >
            {courseTemplates.content.length === 0 ? (
                <EmptyState
                    title="No hay plantillas de cursos"
                    description="Ajusta los filtros para mostrar otras plantillas academicas."
                    icon="fa-layer-group"
                />
            ) : (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Nombre</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Secciones</th>
                        <th scope="col">Área especializada</th>
                        <th scope="col" className="text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {courseTemplates.content.map((template) => (
                        <tr key={template.id}>
                            <td><strong>{template.name ?? "Plantilla"}</strong></td>
                            <td>{template.type ? GradeTypeLabel[template.type] : "-"}</td>
                            <td>{template.count}</td>
                            <td>{template.specialization?.name ?? "Sin área especializada"}</td>
                            <td className="text-right">
                                <button
                                    className="btn btn-xs"
                                    onClick={() => navigate(`/courses/templates/${template.id}`)}
                                >
                                    Detalles
                                    <i className="fa fa-arrow-right ms-2"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </DataTableCard>
    );
};
