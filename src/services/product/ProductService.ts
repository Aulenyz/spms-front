import {Page, Pagination} from "../../domain/filters/Page.ts";
import {
    ChangePriceRequest,
    Product,
    ProductDetails,
    ProductFormValues,
    ProductStatus,
    ProductType,
    RecurrenceType,
} from "../../domain/model/product/Product.ts";
import {KeyValue} from "../../domain/types/steoreotype.ts";
import {BaseService} from "../BaseService.ts";

export type ProductSearchFilters = {
    term?: string;
    status?: ProductStatus;
    type?: ProductType;
    categoryId?: number;
    chargeMode?: RecurrenceType;
};

export class ProductService extends BaseService<Product> {
    private static factory: ProductService = new ProductService();

    static get instance(): ProductService {
        return ProductService.factory;
    }

    constructor() {
        super("/products");
    }

    search(filters: ProductSearchFilters = {}, pagination: Pagination = Pagination.default): Promise<Page<Product>> {
        const params: KeyValue = {
            ...pagination,
            term: filters.term?.trim() ?? "",
        };

        if (filters.status) params.status = filters.status;
        if (filters.type) params.type = filters.type;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.chargeMode) params.chargeMode = filters.chargeMode;

        return this.get<Page<Product>>("/search", params);
    }

    grouped(): Promise<Record<string, number>> {
        return this.get<Record<string, number>>("/grouped");
    }

    getProduct(id: number | string): Promise<ProductDetails> {
        return this.get<ProductDetails>(`/${id}`);
    }

    createProduct(payload: ProductFormValues): Promise<Product> {
        return this.post<Product>("", payload);
    }

    updateProduct(id: number | string, payload: ProductFormValues): Promise<Product> {
        return this.put<Product>(`/${id}`, payload);
    }

    updateStatus(id: number | string, status: ProductStatus): Promise<Product> {
        return this.put<Product>(`/${id}/status`, {status});
    }

    updatePrice(id: number | string, payload: ChangePriceRequest): Promise<Product> {
        return this.put<Product>(`/${id}/price`, payload);
    }

    /** Excel con todos los conceptos del filtro. */
    exportExcel(filters: ProductSearchFilters = {}): Promise<Blob> {
        const params: KeyValue = {term: filters.term?.trim() ?? ""};
        if (filters.status) params.status = filters.status;
        if (filters.type) params.type = filters.type;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.chargeMode) params.chargeMode = filters.chargeMode;

        return this.get<Blob>("/export", params);
    }
}
