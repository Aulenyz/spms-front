import {Outlet, useLocation} from "react-router-dom";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {SectionTabs} from "../../components/ui/layout/SectionTabs.tsx";

export const OrganizationOptionsPage = () => {
    const location = useLocation();

    const isCourseTemplates = location.pathname === "/courses/templates";
    const isPriceTemplates = location.pathname === "/courses/templates/prices";
    const isMaterialTemplates = location.pathname === "/courses/templates/materials";

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Configuracion academica"
                title="Plantillas"
                description="Separa las plantillas por tipo para administrar cursos, precios y materiales desde pantallas independientes."
            />
            <SectionTabs tabs={[
                {to: "/courses/templates", label: "Cursos", icon: "fa-layer-group", active: isCourseTemplates, helper: "Academico"},
                {to: "/courses/templates/prices", label: "Precios", icon: "fa-tags", active: isPriceTemplates, helper: "Cobros"},
                {to: "/courses/templates/materials", label: "Materiales", icon: "fa-box-open", active: isMaterialTemplates, helper: "Recursos"},
            ]}/>
            <Outlet/>
        </div>
    );
};
