import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {TemplateInfoCard} from "./TemplateInfoCard.tsx";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";

const MATERIAL_TEMPLATES = [
    {
        id: 1,
        title: "Kit basico primaria",
        subtitle: "Listado base de utiles y materiales para el arranque del periodo en primaria.",
        badge: "Lista",
        accent: "linear-gradient(135deg, #2563eb, #0f62fe)",
        details: [
            {label: "Area", value: "Primaria"},
            {label: "Items", value: 8},
            {label: "Entrega", value: "Inicio"},
        ],
    },
    {
        id: 2,
        title: "Laboratorio ciencias",
        subtitle: "Recursos y consumibles para practicas planificadas por trimestre.",
        badge: "Activa",
        accent: "linear-gradient(135deg, #12805c, #0f766e)",
        details: [
            {label: "Area", value: "Secundaria"},
            {label: "Items", value: 12},
            {label: "Entrega", value: "Trimestral"},
        ],
    },
    {
        id: 3,
        title: "Recursos artisticos",
        subtitle: "Base de materiales reutilizable para talleres y actividades complementarias.",
        badge: "Borrador",
        accent: "linear-gradient(135deg, #be185d, #7c3aed)",
        details: [
            {label: "Area", value: "Complementaria"},
            {label: "Items", value: 6},
            {label: "Entrega", value: "Bajo demanda"},
        ],
    },
];

export const ListMaterialTemplatePage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Configuracion"
                title="Plantillas de materiales"
                description="Define listados base de recursos y kits para reutilizarlos por nivel, area o momento del periodo."
            />

            <DataTableCard
                title="Plantillas"
                description="Centraliza kits y listados reutilizables para el periodo escolar."
                status={<span className="page-header-eyebrow">Registros: {MATERIAL_TEMPLATES.length}</span>}
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {MATERIAL_TEMPLATES.map((template) => (
                        <TemplateInfoCard
                            key={template.id}
                            title={template.title}
                            subtitle={template.subtitle}
                            badge={template.badge}
                            accent={template.accent}
                            details={template.details}
                        />
                    ))}
                </div>
            </DataTableCard>
        </div>
    );
};
