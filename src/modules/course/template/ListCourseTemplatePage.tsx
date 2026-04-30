import {useEffect, useState} from "react";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {CourseTemplate} from "../../../domain/model/course/Course.ts";
import {CourseTemplateCard} from "./CourseTemplateCard.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {CourseTemplateFilter} from "../../../domain/filters/course/CourseTemplateFilter.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";

const courseTemplateService: CourseTemplateService = CourseTemplateService.instance;

export const ListCourseTemplatePage = () => {
    const [pagination, setPagination] = useState(Pagination.first);
    const [filters, setFilters] = useState<Record<string, any>>({
        name: "",
        type: "",
    });
    const [courseTemplates, setCourseTemplates] = useState<Page<CourseTemplate>>(Pagination.empty<CourseTemplate>());

    useEffect(() => {
        courseTemplateService.getAll(filters, pagination).then(setCourseTemplates);
    }, [pagination, filters]);

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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {courseTemplates.content.map((template) => (
                        <CourseTemplateCard key={template.id} courseTemplate={template}/>
                    ))}
                </div>
            )}
        </DataTableCard>
    );
};
