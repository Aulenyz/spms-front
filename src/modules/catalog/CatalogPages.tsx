import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";

const COLLECTIONS = [
    {name: "Inicio de clases · Primaria", description: "Selección recomendada de útiles para comenzar el periodo escolar.", items: 12, audience: "Primaria", status: "Publicada", accent: "linear-gradient(135deg, #2563eb, #0f62fe)"},
    {name: "Prácticas de ciencias", description: "Materiales de protección, instrumentos y consumibles de laboratorio.", items: 9, audience: "Secundaria", status: "Publicada", accent: "linear-gradient(135deg, #0f766e, #12805c)"},
    {name: "Taller de arte", description: "Recursos preparados para dibujo, pintura y actividades creativas.", items: 8, audience: "Todos los niveles", status: "Borrador", accent: "linear-gradient(135deg, #be185d, #7c3aed)"},
];

const CatalogAction = ({label, icon}: {label: string; icon: string}) => (
    <button type="button" className="btn btn-sm btn-primary" title={`${label}: disponible al conectar el catálogo con el backend`}>
        <i className={`fa ${icon}`}/>
        {label}
    </button>
);

export const CatalogCollectionsPage = () => (
    <div className="space-y-6">
        <PageHeader
            title="Kits y colecciones"
            description="Agrupa productos por nivel, asignatura o actividad para reutilizar selecciones frecuentes."
            actions={<CatalogAction label="Nueva colección" icon="fa-plus"/>}
        />
        <DataTableCard title="Colecciones preparadas" description="Conjuntos de recursos listos para asignar o consultar.">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {COLLECTIONS.map((item) => (
                    <article key={item.name} className="overflow-hidden rounded-[24px] border" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
                        <div className="h-2" style={{background: item.accent}}/>
                        <div className="p-5">
                            <div className="flex items-center justify-between gap-3">
                                <span className="sidebar-badge">{item.audience}</span>
                                <span className="text-xs font-semibold" style={{color: item.status === "Publicada" ? "var(--success)" : "var(--text-tertiary)"}}>{item.status}</span>
                            </div>
                            <h3 className="mt-5 text-base font-semibold" style={{color: "var(--text-primary)"}}>{item.name}</h3>
                            <p className="mt-2 min-h-[72px] text-sm leading-6" style={{color: "var(--text-secondary)"}}>{item.description}</p>
                            <div className="mt-5 flex items-center justify-between border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                                <span className="text-xs font-semibold" style={{color: "var(--text-secondary)"}}>{item.items} productos</span>
                                <button type="button" className="table-link">Gestionar <i className="fa fa-chevron-right text-2xs"/></button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </DataTableCard>
    </div>
);
