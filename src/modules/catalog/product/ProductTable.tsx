import {Link} from "react-router-dom";
import {dateRangeLabel, frequencyLabel, limitLabel, Product} from "../../../domain/model/product/Product.ts";
import {ProductStatusPill} from "./ProductStatusPill.tsx";

const currency = new Intl.NumberFormat("es-DO", {style: "currency", currency: "DOP", minimumFractionDigits: 2});

export const ProductTable = ({products}: {products: Product[]}) => (
    <div className="overflow-x-auto">
        <table className="table-shell min-w-[880px]">
            <thead>
            <tr>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Frecuencia</th>
                <th>Cobro</th>
                <th className="text-right">Precio</th>
                <th>Estado</th>
                <th className="w-12"/>
            </tr>
            </thead>
            <tbody>
            {products.map((product) => (
                <tr key={product.id}>
                    <td>
                        <Link to={`/catalog/products/${product.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                            {product.name}
                        </Link>
                        <span className="block text-xs text-[var(--text-tertiary)]">
                            {product.systemKey && <><i className="fa fa-lock me-1"/>Sistema · </>}
                            {product.code || "Sin código"}
                        </span>
                    </td>
                    <td>{product.category?.name ?? "—"}</td>
                    <td>{frequencyLabel(product)}</td>
                    <td>
                        {limitLabel(product.rule)}
                        <span className="block text-xs text-[var(--text-tertiary)]">{dateRangeLabel(product.rule)}</span>
                    </td>
                    <td className="text-right">
                        {Number(product.price) > 0
                            ? <span className="font-semibold text-[var(--text-primary)]">{currency.format(product.price)}</span>
                            : <span className="text-[var(--warning)]"><i className="fa fa-triangle-exclamation me-1"/>Sin precio</span>}
                    </td>
                    <td><ProductStatusPill status={product.status}/></td>
                    <td className="text-right">
                        <Link to={`/catalog/products/${product.id}`} className="row-action" title="Ver detalle" aria-label="Ver detalle">
                            <i className="fa fa-chevron-right"/>
                        </Link>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>
);
