import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {TemplateInfoCard} from "./TemplateInfoCard.tsx";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";

const PRICE_TEMPLATES = [
    {
        id: 1,
        title: "Mensualidad inicial",
        subtitle: "Base de cobro para cuotas recurrentes del periodo escolar.",
        badge: "Activa",
        accent: "linear-gradient(135deg, #0f766e, #12805c)",
        details: [
            {label: "Ciclo", value: "Mensual"},
            {label: "Conceptos", value: 4},
            {label: "Aplicacion", value: "General"},
        ],
    },
    {
        id: 2,
        title: "Reinscripcion anual",
        subtitle: "Plantilla de cobro para renovaciones y cargos de inicio de ciclo.",
        badge: "Activa",
        accent: "linear-gradient(135deg, #c47b07, #ea580c)",
        details: [
            {label: "Ciclo", value: "Anual"},
            {label: "Conceptos", value: 3},
            {label: "Aplicacion", value: "Continuidad"},
        ],
    },
    {
        id: 3,
        title: "Servicios complementarios",
        subtitle: "Configuracion base para talleres, laboratorios y cargos opcionales.",
        badge: "Borrador",
        accent: "linear-gradient(135deg, #7c3aed, #9333ea)",
        details: [
            {label: "Ciclo", value: "Flexible"},
            {label: "Conceptos", value: 5},
            {label: "Aplicacion", value: "Opcional"},
        ],
    },
];

export const ListPriceTemplatePage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Configuracion"
                title="Plantillas de precios"
                description="Agrupa estructuras de cobro reutilizables para mensualidades, reinscripciones y servicios adicionales."
            />

            <DataTableCard
                title="Plantillas"
                description="Administra plantillas de cobro por categoria y aplica configuraciones base."
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {PRICE_TEMPLATES.map((template) => (
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
