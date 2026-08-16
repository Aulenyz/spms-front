import {Fragment, useState} from "react";
import {TableDetailAction} from "../../../components/ui/data/TableDetailAction.tsx";
import {Product, ProductTypeLabel, RecurrenceTypeLabel} from "../../../domain/model/product/Product.ts";
import {ProductStatusPill} from "./ProductStatusPill.tsx";

const currency = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
});

const rate = new Intl.NumberFormat("es-DO", {maximumFractionDigits: 2});

export const ProductTable = ({products}: {products: Product[]}) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
        <div className="overflow-x-auto">
            <table className="table-shell min-w-[1040px]">
                <thead>
                <tr>
                    <th className="w-12"/>
                    <th>Código</th>
                    <th>Recurso</th>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th className="text-right">Precio</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {products.map((product) => {
                    const expanded = expandedId === product.id;
                    return (
                        <Fragment key={product.id}>
                            <tr>
                                <td>
                                    <button
                                        type="button"
                                        className="icon-button h-8 w-8"
                                        onClick={() => setExpandedId(expanded ? null : product.id)}
                                        title={expanded ? "Ocultar información" : "Mostrar más información"}
                                    >
                                        <i className={`fa ${expanded ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}/>
                                    </button>
                                </td>
                                <td><strong>{product.code || "-"}</strong></td>
                                <td>
                                    <div className="min-w-[190px]">
                                        <strong className="block text-[var(--text-primary)]">{product.name}</strong>
                                        <span className="mt-1 block max-w-[260px] truncate text-xs text-[var(--text-tertiary)]">
                                            {product.description || "Sin descripción"}
                                        </span>
                                    </div>
                                </td>
                                <td>{ProductTypeLabel[product.type] ?? product.type}</td>
                                <td>{product.category?.name ?? "Sin categoría"}</td>
                                <td className="text-right font-semibold text-[var(--text-primary)]">{currency.format(product.price ?? 0)}</td>
                                <td><ProductStatusPill status={product.status}/></td>
                                <td className="text-right">
                                    <TableDetailAction to={`/catalog/products/${product.id}`}/>
                                </td>
                            </tr>

                            {expanded && (
                                <tr>
                                    <td colSpan={8} className="!p-0">
                                        <div
                                            className="m-2 grid grid-cols-1 gap-4 rounded-[20px] border p-4 md:grid-cols-2 xl:grid-cols-4"
                                            style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                                        >
                                            <Info label="Descripción" value={product.description || "Sin descripción registrada"} className="md:col-span-2"/>
                                            <Info label="Categoría" value={product.category ? `${product.category.code} · ${product.category.name}` : "Sin categoría"}/>
                                            <Info label="Origen" value={product.isSystem ? "Recurso protegido del sistema" : "Recurso administrable"}/>
                                            <Info label="Tipo" value={ProductTypeLabel[product.type] ?? product.type}/>
                                            <Info label="Modalidad de cobro" value={RecurrenceTypeLabel[product.chargeMode] ?? product.chargeMode}/>
                                            <Info
                                                label="Categoría fiscal"
                                                value={product.taxCategory
                                                    ? `${product.taxCategory.code} · ${product.taxCategory.name} (${rate.format(product.taxCategory.rate ?? 0)}%)`
                                                    : "Sin impuesto asociado"}
                                            />
                                            <Info label="Precio configurado" value={currency.format(product.price ?? 0)}/>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

const Info = ({label, value, className = ""}: {label: string; value: string; className?: string}) => (
    <div className={className}>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</span>
        <span className="mt-1.5 block text-sm leading-6 text-[var(--text-primary)]">{value}</span>
    </div>
);
