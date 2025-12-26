import {BaseService} from "../BaseService.ts";
import {UserAuthority} from "../../domain/model/user/user.ts";

export class AuthorityService extends BaseService<UserAuthority> {

    private static factory: AuthorityService = new AuthorityService();

    static get instance(): AuthorityService {
        return AuthorityService.factory;
    }

    constructor() {
        super('/authorities');
    }

    async existsByName(name: string): Promise<boolean> {
        const res = await this.get<{ result: boolean; }>(`/name/${name}/exists`);
        return res.result;
    }

    async existsByKey(key: string): Promise<boolean> {
        const res = await this.get<{ result: boolean; }>(`/key/${key}/exists`);
        return res.result;
    }
}