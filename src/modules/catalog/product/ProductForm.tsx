import {FormEvent, ReactNode, useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {
    formatTaxRate,
    intervalLabel,
    ProductDetails,
    ProductFormValues,
    ProductType,
    ProductTypeLabel,
    RecurrenceType,
} from "../../../domain/model/product/Product.ts";
import {ProductService} from "../../../services/product/ProductService.ts";
import {ProductCategoryService} from "../../../services/product/ProductCategoryService.ts";
import {TaxCategoryService} from "../../../services/product/TaxCategoryService.ts";
import {Pagination} from "../../../domain/filters/Page.ts";

const productService = ProductService.instance;
const categoryService = ProductCategoryService.instance;
const taxService = TaxCategoryService.instance;

const INTERVALS = [1, 2, 3, 4, 6, 12];

type LimitMode = "unlimited" | "once" | "custom";

type FormState = {
    code: string;
    name: string;
    description: string;
    price: string;
    type: ProductType;
    recurring: boolean;
    intervalMonths: string;
    billingDay: string;
    startDate: string;
    endDate: string;
    limitMode: LimitMode;
    maxPerStudent: string;
    categoryId: string;
    taxCategoryId: string;
};

const fromProduct = (product?: ProductDetails | null): FormState => {
    const max = product?.rule?.maxPerStudent;
    return {
        code: product?.code ?? "",
        name: product?.name ?? "",
        description: product?.description ?? "",
        price: product ? String(product.price ?? 0) : "",
        type: product?.type ?? ProductType.SERVICE,
        recurring: product ? product.chargeMode !== RecurrenceType.NONE : false,
        intervalMonths: String(product?.rule?.intervalMonths ?? 1),
        billingDay: String(product?.rule?.billingDay ?? 5),
        startDate: product?.rule?.startDate ?? "",
        endDate: product?.rule?.endDate ?? "",
        limitMode: !max ? "unlimited" : max === 1 ? "once" : "custom",
        maxPerStudent: max && max > 1 ? String(max) : "2",
        categoryId: product?.category?.id?.toString() ?? "",
        taxCategoryId: product?.taxCategory?.id?.toString() ?? "",
    };
};

const errorMessage = (error: unknown, fallback: string) =>
    typeof error === "object" && error && typeof (error as {message?: unknown}).message === "string"
        ? (error as {message: string}).message : fallback;

/**
 * Crear o editar un concepto de pago con su regla de cobro: frecuencia (pago único o cada N meses),
 * día de pago, rango de fechas y límite por estudiante en el periodo. El precio solo se define al
 * crearlo; después se usa "Cambiar precio" para que quede en el historial. Inscripción y Reinscripción
 * son conceptos del sistema: solo se cambia su nombre, descripción, impuesto y fechas.
 */
export const ProductForm = ({product, onDone, onSaved}: {
    product?: ProductDetails | null;
    onDone: () => void;
    onSaved: (saved: {id: number}) => void;
}) => {
    const [values, setValues] = useState<FormState>(() => fromProduct(product));
    const [saving, setSaving] = useState(false);
    const editing = Boolean(product?.id);
    const locked = Boolean(product?.systemKey);

    useEffect(() => setValues(fromProduct(product)), [product]);

    const {data: categories = []} = useQuery({
        queryKey: [...queryKeys.categories.all, "options"],
        queryFn: ({signal}) => categoryService.withSignal(signal).search({active: true}, Pagination.ofSize(100))
            .then((page) => page.content),
    });
    const {data: taxes = []} = useQuery({
        queryKey: queryKeys.taxes,
        queryFn: ({signal}) => taxService.withSignal(signal).list(),
    });
    const activeTaxes = useMemo(() => taxes.filter((tax) => tax.active || tax.id === product?.taxCategory?.id), [taxes, product]);

    useEffect(() => {
        if (!values.taxCategoryId && activeTaxes.length)
            setValues((current) => ({...current, taxCategoryId: String(activeTaxes[0].id)}));
    }, [activeTaxes, values.taxCategoryId]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setValues((current) => ({...current, [key]: value}));

    const price = Number(values.price);
    const day = Number(values.billingDay);
    const max = Number(values.maxPerStudent);
    const datesValid = !values.startDate || !values.endDate || values.endDate >= values.startDate;
    const valid = Boolean(values.name.trim() && values.categoryId && values.taxCategoryId)
        && (editing || (values.price !== "" && price >= 0))
        && (!values.recurring || (Number.isInteger(day) && day >= 1 && day <= 28))
        && (values.limitMode !== "custom" || (Number.isInteger(max) && max >= 1))
        && datesValid;

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!valid) return;
        const payload: ProductFormValues = {
            code: values.code.trim() || undefined,
            name: values.name.trim(),
            description: values.description.trim() || undefined,
            price: editing ? product?.price ?? 0 : price,
            type: values.type,
            chargeMode: values.recurring ? RecurrenceType.MONTHLY : RecurrenceType.NONE,
            intervalMonths: values.recurring ? Number(values.intervalMonths) : undefined,
            billingDay: values.recurring ? day : undefined,
            startDate: values.startDate || undefined,
            endDate: values.endDate || undefined,
            maxPerStudent: values.limitMode === "unlimited" ? undefined : values.limitMode === "once" ? 1 : max,
            categoryId: Number(values.categoryId),
            taxCategoryId: Number(values.taxCategoryId),
        };
        setSaving(true);
        try {
            const saved = editing && product
                ? await productService.updateProduct(product.id, payload)
                : await productService.createProduct(payload);
            toast.success(editing ? "Concepto actualizado." : "Concepto creado.");
            onSaved(saved);
            onDone();
        } catch (error) {
            toast.error(errorMessage(error, "No se pudo guardar el concepto."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="flex h-full min-h-0 flex-col" onSubmit={submit}>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4 pt-4">
                {locked && (
                    <p className="rounded-[12px] px-3 py-2 text-xs" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                        <i className="fa fa-lock me-1"/>Concepto del sistema: se cobra una vez por estudiante en cada periodo.
                        Puedes cambiar el nombre, la descripción, el impuesto y las fechas.
                    </p>
                )}

                <Group title="Datos del concepto">
                    <label className="block">
                        <span className="form-label">Nombre *</span>
                        <input className="input input-sm" value={values.name} maxLength={128} autoFocus
                               onChange={(event) => set("name", event.target.value)} placeholder="Ej.: Mensualidad, Transporte, Libro de Matemáticas"/>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="form-label">Categoría *</span>
                            <select className="select select-sm" value={values.categoryId} disabled={locked}
                                    onChange={(event) => set("categoryId", event.target.value)}>
                                <option value="">Selecciona</option>
                                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                            </select>
                        </label>
                        <label className="block">
                            <span className="form-label">Tipo *</span>
                            <select className="select select-sm" value={values.type} disabled={locked}
                                    onChange={(event) => set("type", event.target.value as ProductType)}>
                                {Object.values(ProductType).map((type) => <option key={type} value={type}>{ProductTypeLabel[type]}</option>)}
                            </select>
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {!editing && (
                            <label className="block">
                                <span className="form-label">Precio *</span>
                                <input className="input input-sm" type="number" min={0} step="0.01" value={values.price}
                                       onChange={(event) => set("price", event.target.value)} placeholder="0.00"/>
                            </label>
                        )}
                        <label className={editing ? "col-span-2 block" : "block"}>
                            <span className="form-label">Impuesto *</span>
                            <select className="select select-sm" value={values.taxCategoryId}
                                    onChange={(event) => set("taxCategoryId", event.target.value)}>
                                {activeTaxes.map((tax) => <option key={tax.id} value={tax.id}>{formatTaxRate(tax)}</option>)}
                            </select>
                        </label>
                    </div>
                    <label className="block">
                        <span className="form-label">Código</span>
                        <input className="input input-sm uppercase" value={values.code} maxLength={32} disabled={locked}
                               onChange={(event) => set("code", event.target.value)} placeholder="Opcional, para identificarlo rápido"/>
                    </label>
                </Group>

                <Group title="¿Cómo se cobra?">
                    <div className="grid grid-cols-2 gap-2">
                        <Choice active={!values.recurring} disabled={locked} onClick={() => set("recurring", false)}
                                icon="fa-receipt" title="Pago único" hint="Se cobra una sola vez"/>
                        <Choice active={values.recurring} disabled={locked} onClick={() => set("recurring", true)}
                                icon="fa-rotate" title="Recurrente" hint="Se repite cada cierto tiempo"/>
                    </div>
                    {values.recurring && (
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="form-label">Frecuencia *</span>
                                <select className="select select-sm" value={values.intervalMonths}
                                        onChange={(event) => set("intervalMonths", event.target.value)}>
                                    {INTERVALS.map((months) => <option key={months} value={months}>{intervalLabel(months)}</option>)}
                                </select>
                            </label>
                            <label className="block">
                                <span className="form-label">Día de pago *</span>
                                <input className="input input-sm" type="number" min={1} max={28} value={values.billingDay}
                                       onChange={(event) => set("billingDay", event.target.value)}/>
                            </label>
                        </div>
                    )}
                </Group>

                <Group title="¿Cuándo se cobra?" hint="Déjalo vacío si se puede cobrar en cualquier fecha.">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="form-label">Desde</span>
                            <input className="input input-sm" type="date" value={values.startDate}
                                   onChange={(event) => set("startDate", event.target.value)}/>
                        </label>
                        <label className="block">
                            <span className="form-label">Hasta</span>
                            <input className="input input-sm" type="date" value={values.endDate} min={values.startDate || undefined}
                                   onChange={(event) => set("endDate", event.target.value)}/>
                        </label>
                    </div>
                    {!datesValid && <p className="text-xs text-[var(--danger)]">La fecha final no puede ser anterior a la inicial.</p>}
                </Group>

                <Group title="Límite por estudiante" hint="Cuántas veces se le puede cobrar a un mismo estudiante en el periodo escolar.">
                    <div className="grid grid-cols-3 gap-2">
                        <Choice active={values.limitMode === "unlimited"} disabled={locked} onClick={() => set("limitMode", "unlimited")}
                                title="Sin límite"/>
                        <Choice active={values.limitMode === "once"} disabled={locked} onClick={() => set("limitMode", "once")}
                                title="Una vez"/>
                        <Choice active={values.limitMode === "custom"} disabled={locked} onClick={() => set("limitMode", "custom")}
                                title="Varias"/>
                    </div>
                    {values.limitMode === "custom" && (
                        <label className="block">
                            <span className="form-label">Máximo de veces *</span>
                            <input className="input input-sm" type="number" min={1} value={values.maxPerStudent}
                                   onChange={(event) => set("maxPerStudent", event.target.value)}/>
                        </label>
                    )}
                </Group>

                <label className="block">
                    <span className="form-label">Descripción</span>
                    <textarea className="textarea min-h-[80px] resize-none" maxLength={1000} value={values.description}
                              onChange={(event) => set("description", event.target.value)}
                              placeholder="Qué incluye este concepto"/>
                </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-4" style={{borderColor: "var(--border-soft)"}}>
                <button type="button" className="btn btn-sm" onClick={onDone} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !valid}>
                    <i className={saving ? "fa fa-spinner fa-spin" : "fa fa-check"}/>
                    {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear concepto"}
                </button>
            </div>
        </form>
    );
};

const Group = ({title, hint, children}: {title: string; hint?: string; children: ReactNode}) => (
    <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[var(--text-primary)]">{title}</legend>
        {hint && <p className="-mt-2 text-xs text-[var(--text-tertiary)]">{hint}</p>}
        {children}
    </fieldset>
);

const Choice = ({active, disabled, onClick, icon, title, hint}: {
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    icon?: string;
    title: string;
    hint?: string;
}) => (
    <button type="button" disabled={disabled} onClick={onClick}
            className="rounded-[12px] border px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
                borderColor: active ? "var(--accent)" : "var(--border-soft)",
                background: active ? "var(--accent-soft)" : "var(--surface)",
                color: active ? "var(--accent)" : "var(--text-secondary)",
            }}>
        <span className="flex items-center gap-2 font-semibold">{icon && <i className={`fa ${icon}`}/>}{title}</span>
        {hint && <span className="mt-0.5 block text-xs opacity-80">{hint}</span>}
    </button>
);
