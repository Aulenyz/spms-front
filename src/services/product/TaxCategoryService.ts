import {BaseService} from "../BaseService.ts";
import {TaxCategory, TaxCategoryFormValues} from "../../domain/model/product/Product.ts";

export class TaxCategoryService extends BaseService<TaxCategory> {
    private static factory: TaxCategoryService = new TaxCategoryService();

    static get instance(): TaxCategoryService {
        return TaxCategoryService.factory;
    }

    constructor() {
        super("/tax-categories");
    }

    list(): Promise<TaxCategory[]> {
        return this.get<TaxCategory[]>();
    }

    createTax(payload: TaxCategoryFormValues): Promise<TaxCategory> {
        return this.post<TaxCategory>("", payload);
    }

    updateTax(id: number, payload: TaxCategoryFormValues): Promise<TaxCategory> {
        return this.put<TaxCategory>(`/${id}`, payload);
    }
}
