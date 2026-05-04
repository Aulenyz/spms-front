import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {CourseTemplate} from "../../../domain/model/course/Course.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {CourseTemplateFilter} from "../../../domain/filters/course/CourseTemplateFilter.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {GradeTypePill} from "../../../components/io/output/pill/GradeTypePill.tsx";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {CourseTemplateBreadcrumb} from "../../breadcrumb/CourseTemplateBreadcrumb.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {CourseTemplateForm} from "./CourseTemplateForm.tsx";

const courseTemplateService: CourseTemplateService = CourseTemplateService.instance;

export const ListCourseTemplatePage = () => {
    const navigate = useNavigate();
    const [pagination, setPagination] = useState(Pagination.first);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({
        name: "",
        type: "",
    });
    const [courseTemplates, setCourseTemplates] = useState<Page<CourseTemplate>>(Pagination.empty<CourseTemplate>());

    useEffect(() => {
        courseTemplateService.getAll(filters, pagination).then(setCourseTemplates);
    }, [pagination, filters, refreshKey]);

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
        <div className="space-y-6">
            <PageHeader
                eyebrow="Configuracion"
                title="Plantillas de cursos"
                description="Gestiona las plantillas base usadas para organizar cursos, niveles y estructuras academicas."
            />

            <CourseTemplateBreadcrumb onCreate={() => setShowCreate(true)}/>

            <DataTableCard
                title="Listado"
                description="Filtra por nombre o tipo para localizar rapidamente una plantilla."
                status={<span className="page-header-eyebrow">Registros: {courseTemplates.content.length}</span>}
                filters={<CourseTemplateFilter onFilter={handleFilters}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={courseTemplates}/>}
            >
                {courseTemplates.content.length === 0 ? (
                    <EmptyState
                        title="No hay plantillas de cursos"
                        description="Crea una nueva plantilla o ajusta los filtros para continuar."
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
                                <td><GradeTypePill type={template.type}/></td>
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

            <LeftModal
                title="Nuevo curso"
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <CourseTemplateForm
                    onDone={() => setShowCreate(false)}
                    onSaved={() => setRefreshKey((v) => v + 1)}
                />
            </LeftModal>
        </div>
    );
};
