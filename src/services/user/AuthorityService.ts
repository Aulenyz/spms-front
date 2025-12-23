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
}