import {Outlet, useLocation} from "react-router-dom";
import {useState} from "react";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {SectionTabs} from "../../components/ui/layout/SectionTabs.tsx";
import {RightModal} from "../../components/shared/RightModal.tsx";
import {CourseTemplateForm} from "../course/template/CourseTemplateForm.tsx";

export const OrganizationOptionsPage = () => {
    const location = useLocation();

    const isCourseTemplates = location.pathname === "/courses/templates";
    const isPriceTemplates = location.pathname === "/courses/templates/prices";
    const isMaterialTemplates = location.pathname === "/courses/templates/materials";
    const [showCourseTemplateModal, setShowCourseTemplateModal] = useState(false);
    const [courseTemplateBump, setCourseTemplateBump] = useState(0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Plantillas"
                description="Separa las plantillas por tipo para administrar cursos, precios y materiales desde pantallas independientes."
                actions={
                    isCourseTemplates ? (
                        <>
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => setShowCourseTemplateModal(true)}
                            >
                                <i className="fa fa-plus me-1"/>
                                <span>Nueva plantilla</span>
                            </button>

                            <RightModal
                                title="Crear plantilla"
                                isOpen={showCourseTemplateModal}
                                onClose={() => setShowCourseTemplateModal(false)}
                                className="w-[420px] h-full z-[9999]"
                            >
                                <CourseTemplateForm
                                    initial={null}
                                    onDone={() => setShowCourseTemplateModal(false)}
                                    onSaved={() => {
                                        setCourseTemplateBump((value) => value + 1);
                                        setShowCourseTemplateModal(false);
                                    }}
                                />
                            </RightModal>
                        </>
                    ) : null
                }
            />
            <SectionTabs tabs={[
                {
                    to: "/courses/templates",
                    label: "Cursos",
                    icon: "fa-layer-group",
                    active: isCourseTemplates,
                    helper: "Academico"
                },
                {
                    to: "/courses/templates/prices",
                    label: "Precios",
                    icon: "fa-tags",
                    active: isPriceTemplates,
                    helper: "Cobros"
                },
                {
                    to: "/courses/templates/materials",
                    label: "Materiales",
                    icon: "fa-box-open",
                    active: isMaterialTemplates,
                    helper: "Recursos"
                },
            ]}/>
            <Outlet context={{courseTemplateBump}}/>
        </div>
    );
};
