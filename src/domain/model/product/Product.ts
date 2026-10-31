export enum ProductType {
    PRODUCT = "PRODUCT",
    SERVICE = "SERVICE",
    FEE = "FEE",
}

export enum ProductStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ARCHIVED = "ARCHIVED",
}

export enum RecurrenceType {
    NONE = "NONE",
    MONTHLY = "MONTHLY",
    EVERY_15_DAYS = "EVERY_15_DAYS",
    CUSTOM_PERIOD = "CUSTOM_PERIOD",
}

export interface BaseProductCategory {
    id: number;
    code: string;
    name: string;
}

export interface TaxCategory {
    id: number;
    code: string;
    name: string;
    active: boolean;
    /** Fracción: 0.18 equivale a 18%. */
    rate: number;
    isSystem: boolean;
    systemKey?: string;
}

/** Cómo se cobra un concepto. */
export interface BillingRule {
    /** Conceptos recurrentes: cada cuántos meses se cobran (1 = mensual, 2 = bimestral...). */
    intervalMonths?: number;
    /** Conceptos recurrentes: día del mes en que vence el pago. */
    billingDay?: number;
    startDate?: string;
    endDate?: string;
    /** Veces que se puede cobrar a un estudiante en un periodo escolar; vacío = sin límite. */
    maxPerStudent?: number;
    /** Conceptos recurrentes: se facturan solos a todos los estudiantes inscritos. */
    autoCharge?: boolean;
}

export interface Product {
    id: number;
    createdAt?: string;
    updatedAt?: string;
    code: string;
    name: string;
    type: ProductType;
    price: number;
    isSystem: boolean;
    description?: string;
    status: ProductStatus;
    taxCategory?: TaxCategory;
    chargeMode: RecurrenceType;
    category?: BaseProductCategory;
    systemKey?: string;
    rule?: BillingRule;
}

export interface ProductPriceHistory {
    id: number;
    createdAt?: string;
    updatedAt?: string;
    user?: {
        id: number;
        name?: string;
        email?: string;
        username?: string;
        image?: string;
        status?: string;
    };
    oldPrice?: number;
    newPrice?: number;
    changeReason?: string;
}

export interface ProductDetails extends Product {
    prices?: ProductPriceHistory[];
}

/** Datos para crear o editar un concepto de pago. El precio solo se envía al crearlo. */
export interface ProductFormValues {
    code?: string;
    name: string;
    description?: string;
    price: number;
    type: ProductType;
    chargeMode: RecurrenceType;
    categoryId: number;
    taxCategoryId: number;
    intervalMonths?: number;
    billingDay?: number;
    startDate?: string;
    endDate?: string;
    maxPerStudent?: number;
    autoCharge?: boolean;
}

export interface TaxCategoryFormValues {
    code: string;
    name: string;
    /** Fracción: 0.18 equivale a 18%. */
    rate: number;
    active: boolean;
}

export interface ChangePriceRequest {
    price: number;
    reason?: string;
}

export const ProductTypeLabel: Record<ProductType, string> = {
    [ProductType.PRODUCT]: "Artículo",
    [ProductType.SERVICE]: "Servicio",
    [ProductType.FEE]: "Cuota",
};

export const ProductStatusLabel: Record<ProductStatus, string> = {
    [ProductStatus.ACTIVE]: "Activo",
    [ProductStatus.INACTIVE]: "Inactivo",
    [ProductStatus.ARCHIVED]: "Archivado",
};

export const RecurrenceTypeLabel: Record<RecurrenceType, string> = {
    [RecurrenceType.NONE]: "Pago único",
    [RecurrenceType.MONTHLY]: "Mensual",
    [RecurrenceType.EVERY_15_DAYS]: "Cada 15 días",
    [RecurrenceType.CUSTOM_PERIOD]: "Periodo personalizado",
};

const INTERVAL_NAMES: Record<number, string> = {1: "Mensual", 2: "Cada 2 meses", 3: "Trimestral", 4: "Cada 4 meses", 6: "Semestral", 12: "Anual"};

export const intervalLabel = (months: number) => INTERVAL_NAMES[months] ?? `Cada ${months} meses`;

/** Frecuencia legible: "Pago único", "Mensual", "Cada 2 meses"... */
export const frequencyLabel = (product: Pick<Product, "chargeMode" | "rule">) =>
    product.chargeMode === RecurrenceType.NONE ? "Pago único" : intervalLabel(product.rule?.intervalMonths ?? 1);

export const limitLabel = (rule?: BillingRule) =>
    !rule?.maxPerStudent ? "Sin límite" : rule.maxPerStudent === 1 ? "Una vez por estudiante" : `${rule.maxPerStudent} veces por estudiante`;

const shortDate = new Intl.DateTimeFormat("es-DO", {day: "numeric", month: "short", year: "numeric"});
const toDate = (value: string) => new Date(`${value}T00:00:00`);

/** Rango de cobro legible; vacío cuando no tiene fechas. */
export const dateRangeLabel = (rule?: BillingRule) => {
    if (rule?.startDate && rule.endDate) return `${shortDate.format(toDate(rule.startDate))} – ${shortDate.format(toDate(rule.endDate))}`;
    if (rule?.startDate) return `Desde ${shortDate.format(toDate(rule.startDate))}`;
    if (rule?.endDate) return `Hasta ${shortDate.format(toDate(rule.endDate))}`;
    return "Todo el año";
};

/** "Exento (0%)", "ITBIS 18%": no repite la tasa cuando el nombre ya la incluye. */
export const formatTaxRate = (tax?: TaxCategory) => {
    if (!tax) return "Sin impuesto";
    return tax.name.includes("%") ? tax.name : `${tax.name} (${Number((tax.rate * 100).toFixed(2))}%)`;
};
