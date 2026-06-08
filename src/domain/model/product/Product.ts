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
    rate: number;
    isSystem: boolean;
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

export interface ChangePriceRequest {
    price: number;
    reason?: string;
}

export const ProductTypeLabel: Record<ProductType, string> = {
    [ProductType.PRODUCT]: "Producto",
    [ProductType.SERVICE]: "Servicio",
    [ProductType.FEE]: "Cuota",
};

export const ProductStatusLabel: Record<ProductStatus, string> = {
    [ProductStatus.ACTIVE]: "Activo",
    [ProductStatus.INACTIVE]: "Inactivo",
    [ProductStatus.ARCHIVED]: "Archivado",
};

export const RecurrenceTypeLabel: Record<RecurrenceType, string> = {
    [RecurrenceType.NONE]: "Cobro único",
    [RecurrenceType.MONTHLY]: "Mensual",
    [RecurrenceType.EVERY_15_DAYS]: "Cada 15 días",
    [RecurrenceType.CUSTOM_PERIOD]: "Periodo personalizado",
};
