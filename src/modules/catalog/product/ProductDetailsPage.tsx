import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import {
    ProductDetails,
    ProductPriceHistory,
    ProductStatus,
    ProductStatusLabel,
    ProductTypeLabel,
    RecurrenceTypeLabel,
} from "../../../domain/model/product/Product.ts";
import {ProductService} from "../../../services/product/ProductService.ts";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {InfoList} from "../../../components/ui/detail/InfoList.tsx";
import {Badge, StatusBadge} from "../../../components/ui/detail/StatusBadge.tsx";

const productService = ProductService.instance;

const currency = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
});

const getApiErrorMessage = (error: unknown) => {
    if (typeof error !== "object" || error === null) return null;
    const message = (error as {message?: unknown}).message;
    return typeof message === "string" && message.trim() ? message : null;
};

const sortPriceHistory = (prices: ProductPriceHistory[] = []) => {
    return [...prices].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
    });
};

export const ProductDetailsPage = () => {
    const {id} = useParams<{id: string}>();
    const queryClient = useQueryClient();
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [newPrice, setNewPrice] = useState("");
    const [changeReason, setChangeReason] = useState("");
    const [savingPrice, setSavingPrice] = useState(false);
    const [showPriceForm, setShowPriceForm] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        productService
            .getProduct(id)
            .then(setProduct)
            .catch((error) => {
                setProduct(null);
                toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del recurso.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        setNewPrice(product?.price != null ? String(product.price) : "");
        setChangeReason("");
    }, [product?.id, product?.price]);

    const openPriceForm = () => {
        setNewPrice(product?.price != null ? String(product.price) : "");
        setChangeReason("");
        setShowPriceForm(true);
    };

    const handlePriceUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!product?.id || savingPrice) return;

        const price = Number(newPrice);
        const reason = changeReason.trim();

        if (!Number.isFinite(price) || price <= 0) {
            toast.error("Indica un precio válido mayor que cero.");
            return;
        }

        setSavingPrice(true);
        try {
            const updated = await productService.updatePrice(product.id, {
                price,
                ...(reason ? {reason} : {}),
            });
            setProduct((current) => current ? {...current, ...updated} : current);
            setProduct(await productService.getProduct(product.id));
            void queryClient.invalidateQueries({queryKey: queryKeys.products.all});
            setShowPriceForm(false);
            toast.success("Precio actualizado correctamente.");
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el precio.");
        } finally {
            setSavingPrice(false);
        }
    };

    if (loading) return <LoadingContent loading className="py-16"/>;

    if (!product) {
        return <EmptyState title="Recurso no encontrado" description="Vuelve al listado e intenta nuevamente." icon="fa-box-open"/>;
    }

    const prices = sortPriceHistory(product.prices);

    return (
        <div className="space-y-4">
            <DetailHeader
                avatar={product.name}
                title={product.name}
                subtitle={product.code ? `Código ${product.code}` : undefined}
                badges={<>
                    <StatusBadge active={product.status === ProductStatus.ACTIVE}
                                 activeLabel={ProductStatusLabel[ProductStatus.ACTIVE]}
                                 inactiveLabel={ProductStatusLabel[product.status] ?? product.status}/>
                    {product.isSystem && <Badge><i className="fa fa-lock"/>Protegido</Badge>}
                </>}
                actions={
                    <button type="button" className="btn btn-sm btn-primary" onClick={openPriceForm}>
                        <i className="fa fa-tag"/>Cambiar precio
                    </button>
                }
            />

            <DetailSection title="Información">
                <InfoList columns={3} items={[
                    {label: "Precio actual", value: currency.format(product.price ?? 0)},
                    {label: "Tipo", value: ProductTypeLabel[product.type] ?? product.type},
                    {label: "Modalidad de cobro", value: RecurrenceTypeLabel[product.chargeMode] ?? product.chargeMode},
                    {label: "Categoría", value: product.category?.name},
                    {
                        label: "Impuesto",
                        value: product.taxCategory
                            ? `${product.taxCategory.name} (${product.taxCategory.rate ?? 0}%)`
                            : "Sin impuesto",
                    },
                    {label: "Origen", value: product.isSystem ? "Definido por el sistema" : "Creado por la institución"},
                    {label: "Descripción", value: product.description, full: true},
                ]}/>
            </DetailSection>

            <DetailSection title="Historial de precios" flush>
                {prices.length === 0 ? (
                    <div className="p-5">
                        <EmptyState title="Sin cambios de precio" icon="fa-clock-rotate-left"
                                    description="Aquí aparecerán los cambios de precio de este recurso."/>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-shell min-w-[720px]">
                            <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Precio anterior</th>
                                <th>Precio nuevo</th>
                                <th>Usuario</th>
                                <th>Razón</th>
                            </tr>
                            </thead>
                            <tbody>
                            {prices.map((price) => (
                                <tr key={price.id}>
                                    <td>{price.createdAt ? dateTime.format(new Date(price.createdAt)) : "—"}</td>
                                    <td>{currency.format(price.oldPrice ?? 0)}</td>
                                    <td className="font-semibold text-[var(--text-primary)]">{currency.format(price.newPrice ?? 0)}</td>
                                    <td>{price.user?.name || price.user?.username || price.user?.email || "Sistema"}</td>
                                    <td>{price.changeReason?.trim() || "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </DetailSection>

            <RightModal
                title="Cambiar precio"
                isOpen={showPriceForm}
                onClose={() => setShowPriceForm(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <form className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4" onSubmit={handlePriceUpdate}>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Precio actual: <strong className="text-[var(--text-primary)]">{currency.format(product.price ?? 0)}</strong>
                    </p>

                    <label className="block">
                        <span className="form-label">Nuevo precio *</span>
                        <span className="input input-sm w-full">
                            <i className="fa fa-dollar-sign me-1"/>
                            <input
                                autoFocus
                                min="0.01"
                                step="0.01"
                                type="number"
                                value={newPrice}
                                onChange={(event) => setNewPrice(event.target.value)}
                                placeholder="0.00"
                                disabled={savingPrice}
                            />
                        </span>
                    </label>

                    <label className="block">
                        <span className="form-label">Razón del cambio</span>
                        <textarea
                            className="input min-h-[140px] w-full resize-none py-3"
                            maxLength={160}
                            value={changeReason}
                            onChange={(event) => setChangeReason(event.target.value)}
                            placeholder="Ej.: ajuste por nueva tarifa del período"
                            disabled={savingPrice}
                        />
                        <span className="mt-1 block text-[11px] text-[var(--text-tertiary)]">Máximo 160 caracteres</span>
                    </label>

                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                        <button type="button" className="btn btn-sm" onClick={() => setShowPriceForm(false)} disabled={savingPrice}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-sm btn-primary" disabled={savingPrice}>
                            <i className={savingPrice ? "fa fa-spinner fa-spin" : "fa fa-check"}/>
                            {savingPrice ? "Guardando..." : "Actualizar precio"}
                        </button>
                    </div>
                </form>
            </RightModal>
        </div>
    );
};
