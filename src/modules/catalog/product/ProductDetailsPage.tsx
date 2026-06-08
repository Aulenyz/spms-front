import {useEffect, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";
import {
    ProductDetails,
    ProductPriceHistory,
    ProductTypeLabel,
    RecurrenceTypeLabel,
} from "../../../domain/model/product/Product.ts";
import {ProductService} from "../../../services/product/ProductService.ts";
import {ProductStatusPill} from "./ProductStatusPill.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";

type DetailSection = "summary" | "pricing";

const productService = ProductService.instance;

const currency = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
});

const sections: Array<{key: DetailSection; label: string; hint: string; icon: string}> = [
    {key: "summary", label: "Resumen", hint: "Información", icon: "fa-grid-2"},
    {key: "pricing", label: "Precios", hint: "Historial", icon: "fa-tags"},
];

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
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [section, setSection] = useState<DetailSection>("summary");
    const [newPrice, setNewPrice] = useState("");
    const [changeReason, setChangeReason] = useState("");
    const [savingPrice, setSavingPrice] = useState(false);
    const [showPriceForm, setShowPriceForm] = useState(false);
    const [showActions, setShowActions] = useState(false);

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
        setShowActions(false);
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
            setShowPriceForm(false);
            toast.success("Precio actualizado correctamente.");
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el precio.");
        } finally {
            setSavingPrice(false);
        }
    };

    const initials = useMemo(() => {
        return (product?.name ?? "Recurso")
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }, [product?.name]);

    if (loading) {
        return <div className="p-8 text-center text-sm font-semibold text-[var(--text-secondary)]">Cargando detalle del recurso...</div>;
    }

    if (!product) {
        return <EmptyState title="Recurso no encontrado" description="Vuelve al listado e intenta nuevamente." icon="fa-box-open"/>;
    }

    return (
        <div className="space-y-6">
            <section
                className="relative overflow-visible rounded-[28px] border p-5 sm:p-7"
                style={{
                    borderColor: "var(--border-soft)",
                    background: "radial-gradient(circle at top right, color-mix(in srgb, var(--accent) 12%, transparent), transparent 34%), var(--surface)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                        <div
                            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border text-2xl font-extrabold"
                            style={{borderColor: "var(--border-soft)", background: "var(--accent-soft)", color: "var(--accent)", boxShadow: "var(--shadow-soft)"}}
                        >
                            {initials}
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{product.code}</span>
                                <ProductStatusPill status={product.status}/>
                                {product.isSystem && (
                                    <span className="rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--warning)]">
                                        <i className="fa fa-lock mr-1.5"/>
                                        Protegido
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                                {product.name}
                            </h1>
                            <p className="mt-2 max-w-[760px] text-sm leading-6 text-[var(--text-secondary)]">
                                {product.description || "Sin descripción registrada para este recurso."}
                            </p>
                        </div>
                    </div>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            className="icon-button h-10 w-10"
                            onClick={() => setShowActions((current) => !current)}
                            title="Acciones del recurso"
                        >
                            <i className="fa fa-ellipsis-vertical"/>
                        </button>

                        {showActions && (
                            <div className="floating-panel right-0 top-full z-50 mt-2 w-64">
                                <div className="space-y-1 p-2">
                                    <button type="button" className="profile-menu-item w-full" disabled title="Pendiente de endpoint de edición">
                                        <i className="fa fa-pen text-[var(--accent)]"/>
                                        <span>Editar recurso</span>
                                    </button>
                                    <button type="button" className="profile-menu-item w-full" onClick={openPriceForm}>
                                        <i className="fa fa-tag text-[var(--accent)]"/>
                                        <span>Cambiar precio</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="profile-menu-item w-full"
                                        onClick={() => {
                                            setSection("pricing");
                                            setShowActions(false);
                                        }}
                                    >
                                        <i className="fa fa-clock-rotate-left text-[var(--accent)]"/>
                                        <span>Ver historial de precios</span>
                                    </button>
                                    <button type="button" className="profile-menu-item w-full" disabled title="Pendiente de endpoint de estado">
                                        <i className={`fa ${product.status === "ACTIVE" ? "fa-circle-pause" : "fa-circle-check"} text-[var(--accent)]`}/>
                                        <span>{product.status === "ACTIVE" ? "Inactivar recurso" : "Activar recurso"}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <HeroMetric label="Precio actual" value={currency.format(product.price ?? 0)} icon="fa-money-bill-wave" tone="var(--success)"/>
                    <HeroMetric label="Tipo" value={ProductTypeLabel[product.type] ?? product.type} icon="fa-box" tone="var(--accent)"/>
                    <HeroMetric label="Modalidad" value={RecurrenceTypeLabel[product.chargeMode] ?? product.chargeMode} icon="fa-calendar-days" tone="var(--warning)"/>
                    <HeroMetric label="Categoría" value={product.category?.name ?? "Sin categoría"} icon="fa-folder-open" tone="var(--text-secondary)"/>
                </div>
            </section>

            <section className="surface-card flex h-[560px] flex-col">
                <header className="surface-card-header">
                    <div className="flex flex-wrap items-center gap-2">
                        {sections.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setSection(item.key)}
                                className={clsx("section-tab", section === item.key && "section-tab-active")}
                            >
                                <i className={`fa ${item.icon}`}/>
                                <span>{item.label}</span>
                                <small>{item.hint}</small>
                            </button>
                        ))}
                    </div>
                </header>

                <div className="surface-card-content min-h-0 flex-1 overflow-y-auto">
                    {section === "summary" && <SummarySection product={product}/>}
                    {section === "pricing" && (
                        <PricingSection
                            product={product}
                            onChangePrice={openPriceForm}
                        />
                    )}
                </div>
            </section>

            <RightModal
                title="Cambiar precio"
                isOpen={showPriceForm}
                onClose={() => setShowPriceForm(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <PriceChangeForm
                    currentPrice={product.price}
                    newPrice={newPrice}
                    changeReason={changeReason}
                    saving={savingPrice}
                    onNewPriceChange={setNewPrice}
                    onChangeReasonChange={setChangeReason}
                    onCancel={() => setShowPriceForm(false)}
                    onSubmit={handlePriceUpdate}
                />
            </RightModal>
        </div>
    );
};

const HeroMetric = ({label, value, icon, tone}: {label: string; value: string; icon: string; tone: string}) => (
    <div className="flex items-center gap-3 rounded-[20px] border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "color-mix(in srgb, var(--surface) 94%, transparent)"}}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{background: `color-mix(in srgb, ${tone} 12%, transparent)`, color: tone}}>
            <i className={`fa ${icon}`}/>
        </span>
        <div className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</span>
            <strong className="mt-1 block truncate text-sm text-[var(--text-primary)]">{value}</strong>
        </div>
    </div>
);

const SummarySection = ({product}: {product: ProductDetails}) => {
    return (
        <div className="space-y-5">
            <DetailCard title="Datos complementarios" icon="fa-circle-info">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Info label="Modalidad de cobro" value={RecurrenceTypeLabel[product.chargeMode] ?? product.chargeMode}/>
                    <Info label="Origen" value={product.isSystem ? "Definido por el sistema" : "Creado por la institución"}/>
                    <Info label="Impuesto asociado" value={product.taxCategory ? product.taxCategory.name : "Sin impuesto asociado"}/>
                    <Info label="Tasa aplicada" value={product.taxCategory ? `${product.taxCategory.rate ?? 0}%` : "No aplica"}/>
                </div>
            </DetailCard>

            <DetailCard title="Descripción" icon="fa-align-left">
                <p className="min-h-[120px] text-sm leading-7 text-[var(--text-secondary)]">
                    {product.description || "Sin descripción registrada para este recurso."}
                </p>
            </DetailCard>
        </div>
    );
};

const PricingSection = ({
                            product,
                            onChangePrice,
                        }: {
    product: ProductDetails;
    onChangePrice: () => void;
}) => {
    const prices = sortPriceHistory(product.prices);

    return (
    <div className="space-y-5">
        <DetailCard
            title="Historial de precios"
            icon="fa-clock-rotate-left"
            action="Cambiar precio"
            actionIcon="fa-pen-to-square"
            onAction={onChangePrice}
        >
            <PriceHistoryTable prices={prices}/>
        </DetailCard>
    </div>
    );
};

const PriceChangeForm = ({
                             currentPrice,
                             newPrice,
                             changeReason,
                             saving,
                             onNewPriceChange,
                             onChangeReasonChange,
                             onCancel,
                             onSubmit,
                         }: {
    currentPrice: number;
    newPrice: string;
    changeReason: string;
    saving: boolean;
    onNewPriceChange: (value: string) => void;
    onChangeReasonChange: (value: string) => void;
    onCancel: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) => (
    <form className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4" onSubmit={onSubmit}>
        <div
            className="rounded-[20px] border px-4 py-3"
            style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
        >
            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Precio actual
            </span>
            <strong className="mt-1 block text-xl text-[var(--text-primary)]">{currency.format(currentPrice ?? 0)}</strong>
        </div>

        <div className="space-y-1">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">Nuevo precio*</label>
            <label className="input input-sm w-full">
                <i className="fa fa-dollar-sign me-1"/>
                <input
                    autoFocus
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={newPrice}
                    onChange={(event) => onNewPriceChange(event.target.value)}
                    placeholder="0.00"
                    disabled={saving}
                />
            </label>
        </div>

        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">Razón del cambio</label>
                <span className="text-[11px] text-[var(--text-tertiary)]">Máximo 160 caracteres</span>
            </div>
            <textarea
                className="input min-h-[140px] w-full resize-none py-3"
                maxLength={160}
                value={changeReason}
                onChange={(event) => onChangeReasonChange(event.target.value)}
                placeholder="Ej: ajuste por nueva tarifa del periodo"
                disabled={saving}
            />
        </div>

        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
            <button type="button" className="btn btn-sm" onClick={onCancel} disabled={saving}>
                Cancelar
            </button>
            <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                {saving ? "Guardando..." : "Actualizar precio"}
                <i className="fa fa-save ms-2"/>
            </button>
        </div>
    </form>
);

const PriceHistoryTable = ({prices}: {prices: ProductPriceHistory[]}) => {
    if (prices.length === 0) {
        return (
            <div className="rounded-[18px] border px-4 py-6 text-center text-sm font-semibold text-[var(--text-secondary)]" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                No hay cambios de precio registrados.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="table-shell min-w-[760px]">
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
                        <td>{price.createdAt ? dateTime.format(new Date(price.createdAt)) : "Sin fecha"}</td>
                        <td>{currency.format(price.oldPrice ?? 0)}</td>
                        <td><strong>{currency.format(price.newPrice ?? 0)}</strong></td>
                        <td>{price.user?.name || price.user?.username || price.user?.email || "Sistema"}</td>
                        <td>{price.changeReason?.trim() || "Sin razón"}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

const DetailCard = ({
                        title,
                        icon,
                        action,
                        actionIcon = "fa-plus",
                        onAction,
                        children,
                    }: {
    title: string;
    icon: string;
    action?: string;
    actionIcon?: string;
    onAction?: () => void;
    children: React.ReactNode;
}) => (
    <section className="overflow-hidden rounded-[22px] border" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}>
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><i className={`fa ${icon} text-[var(--accent)]`}/>{title}</h3>
            {action && (
                <button type="button" className="btn btn-sm" onClick={onAction} disabled={!onAction}>
                    <i className={`fa ${actionIcon}`}/>
                    {action}
                </button>
            )}
        </header>
        <div className="p-4">{children}</div>
    </section>
);

const Info = ({label, value}: {label: string; value: string}) => (
    <div className="rounded-[18px] border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</span>
        <strong className="mt-1.5 block break-words text-sm text-[var(--text-primary)]">{value}</strong>
    </div>
);
