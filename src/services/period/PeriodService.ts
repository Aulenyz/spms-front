import {BaseService} from "../BaseService.ts";
import {Optional, PlainValue} from "../../domain/types/steoreotype.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Period} from "../../domain/model/organization/Organization.tsx";

export class PeriodService extends BaseService<Period> {

    private static factory: PeriodService = new PeriodService();

    public static get instance(): PeriodService {
        return PeriodService.factory;
    }

    constructor() {
        super('/periods');
    }

    search(filters: Record<string, Optional<PlainValue>> = {}, pagination: Pagination = Pagination.default): Promise<Page<Period>> {
        return this.get<Page<Period>>('/search', {...pagination, ...filters});
    }

    async current(): Promise<Period> {
        return super.get<Period>('/current');
    }
}