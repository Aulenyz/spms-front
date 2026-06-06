import {useMemo, useState} from "react";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";

type CatalogProduct = {
    id: number;
    name: string;
    code: string;
    category: string;
    audience: string;
    stock: number;
    unit: string;
    active: boolean;
    icon: string;
    accent: string;
};

const PRODUCTS: CatalogProduct[] = [
    {id: 1, name: "Cuaderno cuadriculado", code: "UTL-001", category: "Útiles escolares", audience: "Primaria", stock: 84, unit: "unidades", active: true, icon: "fa-book", accent: "#2563eb"},
    {id: 2, name: "Kit de geometría", code: "MAT-014", category: "Material didáctico", audience: "Secundaria", stock: 31, unit: "kits", active: true, icon: "fa-ruler-combined", accent: "#7c3aed"},
    {id: 3, name: "Bata de laboratorio", code: "LAB-008", category: "Laboratorio", audience: "Secundaria", stock: 12, unit: "unidades", active: true, icon: "fa-flask", accent: "#0f766e"},
    {id: 4, name: "Camiseta de educación física", code: "UNI-021", category: "Uniformes", audience: "Todos los niveles", stock: 0, unit: "unidades", active: false, icon: "fa-shirt", accent: "#c47b07"},
    {id: 5, name: "Set de pintura escolar", code: "ART-006", category: "Arte y creatividad", audience: "Inicial y primaria", stock: 26, unit: "sets", active: true, icon: "fa-palette", accent: "#be185d"},
    {id: 6, name: "Libro de lectura guiada", code: "LIB-032", category: "Libros y lecturas", audience: "Primaria", stock: 45, unit: "ejemplares", active: true, icon: "fa-book-open", accent: "#12805c"},
];

const COLLECTIONS = [
    {name: "Inicio de clases · Primaria", description: "Selección recomendada de útiles para comenzar el periodo escolar.", items: 12, audience: "Primaria", status: "Publicada", accent: "linear-gradient(135deg, #2563eb, #0f62fe)"},
    {name: "Prácticas de ciencias", description: "Materiales de protección, instrumentos y consumibles de laboratorio.", items: 9, audience: "Secundaria", status: "Publicada", accent: "linear-gradient(135deg, #0f766e, #12805c)"},
    {name: "Taller de arte", description: "Recursos preparados para dibujo, pintura y actividades creativas.", items: 8, audience: "Todos los niveles", status: "Borrador", accent: "linear-gradient(135deg, #be185d, #7c3aed)"},
];

const StatusPill = ({active}: {active: boolean}) => (
    <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{
            color: active ? "var(--success)" : "var(--text-secondary)",
            background: active ? "color-mix(in srgb, var(--success) 12%, transparent)" : "var(--surface-muted)",
        }}
    >
        <span className="h-1.5 w-1.5 rounded-full" style={{background: active ? "var(--success)" : "var(--text-tertiary)"}}/>
        {active ? "Disponible" : "No disponible"}
    </span>
);

const CatalogAction = ({label, icon}: {label: string; icon: string}) => (
    <button type="button" className="btn btn-sm btn-primary" title={`${label}: disponible al conectar el catálogo con el backend`}>
        <i className={`fa ${icon}`}/>
        {label}
    </button>
);

export const CatalogProductsPage = () => {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("Todas");
    const categories = ["Todas", ...Array.from(new Set(PRODUCTS.map((product) => product.category)))];
    const filteredProducts = useMemo(() => {
        const term = query.trim().toLowerCase();
        return PRODUCTS.filter((product) => (
            (category === "Todas" || product.category === category)
            && (!term || `${product.name} ${product.code} ${product.category}`.toLowerCase().includes(term))
        ));
    }, [category, query]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Productos"
                description="Organiza los artículos, materiales y recursos disponibles para la comunidad educativa."
                actions={<CatalogAction label="Nuevo producto" icon="fa-plus"/>}
            />
            <DataTableCard
                title="Listado de productos"
                description={`${filteredProducts.length} productos visibles de ${PRODUCTS.length} registrados.`}
                filters={(
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="sidebar-search-wrap min-w-[240px]">
                            <i className="fa fa-search sidebar-search-icon"/>
                            <input className="sidebar-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto o código"/>
                        </div>
                        <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
                            {categories.map((option) => <option key={option}>{option}</option>)}
                        </select>
                    </div>
                )}
            >
                {filteredProducts.length === 0 ? (
                    <EmptyState title="No encontramos productos" description="Cambia la búsqueda o selecciona otra categoría." icon="fa-box-open"/>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredProducts.map((product) => (
                            <article key={product.id} className="rounded-[24px] border p-5 transition-transform hover:-translate-y-1" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg" style={{color: product.accent, background: `color-mix(in srgb, ${product.accent} 12%, transparent)`}}>
                                        <i className={`fa ${product.icon}`}/>
                                    </div>
                                    <StatusPill active={product.active}/>
                                </div>
                                <div className="mt-5 space-y-2">
                                    <span className="text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>{product.code} · {product.category}</span>
                                    <h3 className="text-base font-semibold" style={{color: "var(--text-primary)"}}>{product.name}</h3>
                                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>Dirigido a {product.audience}.</p>
                                </div>
                                <div className="mt-5 flex items-center justify-between border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                                    <span className="text-xs font-semibold" style={{color: product.stock > 0 ? "var(--text-secondary)" : "var(--danger)"}}>{product.stock} {product.unit}</span>
                                    <button type="button" className="table-link">Gestionar <i className="fa fa-chevron-right text-2xs"/></button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </DataTableCard>
        </div>
    );
};

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
