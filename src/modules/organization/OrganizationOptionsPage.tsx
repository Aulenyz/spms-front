import {Outlet, useLocation} from "react-router-dom";
import {useState} from "react";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {RightModal} from "../../components/shared/RightModal.tsx";
import {CourseTemplateForm} from "../course/template/CourseTemplateForm.tsx";

export const OrganizationOptionsPage = () => {
    const location = useLocation();

    const isCourseTemplates = location.pathname === "/courses/templates";
    const [showCourseTemplateModal, setShowCourseTemplateModal] = useState(false);
    const [courseTemplateBump, setCourseTemplateBump] = useState(0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Plantillas"
                description="Define cada curso: secciones, materias, profesores y horarios."
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
            <Outlet context={{courseTemplateBump}}/>
        </div>
    );
};
