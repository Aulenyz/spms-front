import {SortOrder} from "../Page.ts";
import {ProductStatus, ProductType, RecurrenceType} from "../../model/product/Product.ts";

export type ProductFilterValues = {
    term: string;
    status?: ProductStatus;
    type?: ProductType;
    categoryId?: number;
    chargeMode?: RecurrenceType;
    field: string;
    order: SortOrder;
};

/**
 * Valores iniciales del filtro. No se emiten al montar: la página debe iniciar sus filtros
 * (status ACTIVE) y su orden (field "id", order DESC) con estos valores.
 */
export const PRODUCT_FILTER_DEFAULTS: ProductFilterValues = {
    term: "",
    status: ProductStatus.ACTIVE,
    field: "id",
    order: SortOrder.DESC,
};

