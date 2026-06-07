import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Product, ProductStatus, ProductType, RecurrenceType} from "../../domain/model/product/Product.ts";
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

    async export(filters: ProductSearchFilters = {}): Promise<void> {
        const params: KeyValue = {term: filters.term?.trim() ?? ""};
        if (filters.status) params.status = filters.status;
        if (filters.type) params.type = filters.type;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.chargeMode) params.chargeMode = filters.chargeMode;

        const blob = await this.get<Blob>("/export", params);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "productos.xlsx";
        link.click();
        URL.revokeObjectURL(url);
    }
}
