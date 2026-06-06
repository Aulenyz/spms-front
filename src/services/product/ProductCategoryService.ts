import {Page, Pagination} from "../../domain/filters/Page.ts";
import {ProductCategory, ProductCategoryFormValues} from "../../domain/model/product/ProductCategory.ts";
import {KeyValue, ResultResponse} from "../../domain/types/steoreotype.ts";
import {BaseService} from "../BaseService.ts";

export type ProductCategorySearchFilters = {
    term?: string;
    active?: boolean;
};

export class ProductCategoryService extends BaseService<ProductCategory> {
    private static factory: ProductCategoryService = new ProductCategoryService();

    static get instance(): ProductCategoryService {
        return ProductCategoryService.factory;
    }

    constructor() {
        super("/product-categories");
    }

    search(
        filters: ProductCategorySearchFilters = {active: true},
        pagination: Pagination = Pagination.first,
    ): Promise<Page<ProductCategory>> {
        const params: KeyValue = {
            ...pagination,
            term: filters.term?.trim() ?? "",
        };

        if (filters.active !== undefined) {
            params.active = filters.active;
        }

        return this.get<Page<ProductCategory>>("/search", params);
    }

    getCategory(id: number): Promise<ProductCategory> {
        return this.getOne(id);
    }

    createCategory(payload: Omit<ProductCategoryFormValues, "active">): Promise<ProductCategory> {
        return this.create("", payload) as Promise<ProductCategory>;
    }

    updateCategory(id: number, payload: ProductCategoryFormValues): Promise<ProductCategory> {
        return this.update<ProductCategoryFormValues, ProductCategory>(id, payload);
    }

    async existsByCode(code: string, id?: number): Promise<boolean> {
        const normalized = encodeURIComponent(code.trim());
        const endpoint = id ? `/${id}/code/${normalized}/exists` : `/code/${normalized}/exists`;
        const response = await this.get<ResultResponse<boolean>>(endpoint);
        return Boolean(response.result);
    }

    async existsByName(name: string, id?: number): Promise<boolean> {
        const normalized = encodeURIComponent(name.trim());
        const endpoint = id ? `/${id}/name/${normalized}/exists` : `/name/${normalized}/exists`;
        const response = await this.get<ResultResponse<boolean>>(endpoint);
        return Boolean(response.result);
    }

    grouped(): Promise<Record<string, number>> {
        return this.get<Record<string, number>>("/grouped");
    }
}
