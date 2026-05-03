import {Specialization} from "../../domain/model/course/Course.ts";
import {BaseService} from "../BaseService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";

export class SpecializationService extends BaseService<Specialization> {

    private static factory: SpecializationService = new SpecializationService();

    static get instance(): SpecializationService {
        return SpecializationService.factory;
    }

    constructor() {
        super('/specializations');
    }

    search(term: string, pagination: Pagination = Pagination.first): Promise<Page<Specialization>> {
        // Backend expects `term` always present (even when empty).
        return this.get<Page<Specialization>>("/search", {...pagination, term: term ?? ""});
    }

    updateStatus(id: number | string): Promise<Specialization> {
        return this.put<Specialization>(`/${id}/status`);
    }
}
