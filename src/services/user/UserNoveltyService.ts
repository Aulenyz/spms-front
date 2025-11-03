import {BaseService} from "../BaseService.ts";
import {UserNoveltyRequest} from "../../domain/model/user/user-novelty.ts";

export class UserNoveltyService extends BaseService<UserNoveltyRequest> {

    private static factory: UserNoveltyService = new UserNoveltyService();

    static get instance(): UserNoveltyService {
        return UserNoveltyService.factory;
    }

    constructor() {
        super('/users/incidents');
    }
}