import {useEffect, useState} from "react";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {CourseTemplate} from "../../../domain/model/course/Course.ts";
import {CourseTemplateCard} from "./CourseTemplateCard.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {CourseTemplateFilter} from "../../../domain/filters/course/CourseTemplateFilter.tsx";

const courseTemplateService: CourseTemplateService = CourseTemplateService.instance;

export const ListCourseTemplatePage = () => {

    const [pagination, setPagination] = useState({...Pagination.first, size: 8});
    const [filters, setFilters] = useState<Record<string, any>>({
        name: "",
        type: "",
    });

    const [courseTemplates, setCourseTemplates] = useState<Page<CourseTemplate>>(Pagination.empty<CourseTemplate>());

    const load = () => {
        courseTemplateService.getAll(filters, pagination).then(setCourseTemplates);
    };

    useEffect(load, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination(prev => ({...prev, page}));
    };

    const handleFilters = (f: Record<string, any>) => {
        setFilters(f);
        setPagination(prev => ({...prev, page: 0}));
    };

    return (
        <div>
            {/* Título principal */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    Plantillas de Cursos
                </h1>
            </div>
            <div className="card border border-gray-200 rounded-md shadow-sm">
                <div
                    className="card-header flex justify-between items-end flex-wrap gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h1 className="text-gray-500 text-sm">
                        Catálogo de Plantillas de Cursos disponibles.
                    </h1>
                    <div className="flex justify-end">
                        <CourseTemplateFilter onFilter={handleFilters}/>
                    </div>
                </div>

                <div className="px-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {courseTemplates.content.map((spec) => (
                            <CourseTemplateCard key={spec.id} courseTemplate={spec}/>
                        ))}
                    </div>
                </div>
                {/* Footer: paginación */}
                <Pager onChange={handlePageChange} page={courseTemplates}/>
            </div>

        </div>
    );
};
