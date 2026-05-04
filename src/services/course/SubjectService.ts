import {BaseService} from "../BaseService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Subject, SubjectFormValues} from "../../domain/model/course/Subject.ts";
import {ResultResponse} from "../../domain/types/steoreotype.ts";

export class SubjectService extends BaseService<Subject> {
    private static factory: SubjectService = new SubjectService();

    static get instance(): SubjectService {
        return SubjectService.factory;
    }

    constructor() {
        super("/subjects");
    }

    search(filters: Record<string, any> = {}, pagination: Pagination = Pagination.first): Promise<Page<Subject>> {
        // Backend SearchSpecification expects `term` (can be empty).
        const term = (filters.term ?? "").toString();
        const active = filters.active;
        const params: Record<string, any> = {...pagination, term};
        if (active !== "" && active !== undefined && active !== null) params.active = active;
        return this.get<Page<Subject>>("/search", params);
    }

    async existsByName(name: string, id?: number): Promise<boolean> {
        const normalized = encodeURIComponent(name?.trim() ?? "");
        const endpoint = id ? `/${id}/name/${normalized}/exists` : `/name/${normalized}/exists`;
        const res = await this.get<ResultResponse<boolean>>(endpoint);
        return Boolean(res.result);
    }

    async existsByCode(code: string, id?: number): Promise<boolean> {
        const normalized = encodeURIComponent(code?.trim() ?? "");
        const endpoint = id ? `/${id}/code/${normalized}/exists` : `/code/${normalized}/exists`;
        const res = await this.get<ResultResponse<boolean>>(endpoint);
        return Boolean(res.result);
    }

    createSubject(payload: SubjectFormValues): Promise<Subject> {
        return this.create("", payload) as Promise<Subject>;
    }

    updateSubject(id: number, payload: SubjectFormValues): Promise<Subject> {
        return this.update<SubjectFormValues, Subject>(id, payload);
    }

    updateStatus(id: number | string): Promise<Subject> {
        return this.put<Subject>(`/${id}/status`);
    }
}

