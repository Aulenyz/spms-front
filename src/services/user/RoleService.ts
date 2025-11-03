import {BaseService} from "../BaseService.ts";
import {Optional, PlainValue} from "../../domain/types/steoreotype.ts";
import {UserRole} from "../../domain/model/user/user.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";

export class RoleService extends BaseService<UserRole> {

    private static factory: RoleService = new RoleService();

    static get instance(): RoleService {
        return RoleService.factory;
    }

    constructor() {
        super('/roles');
    }

    search(filters: Record<string, Optional<PlainValue>> = {}, pagination: Pagination = Pagination.default): Promise<Page<UserRole>> {
        return this.get<Page<UserRole>>('/search', {...pagination, ...filters});
    }

}