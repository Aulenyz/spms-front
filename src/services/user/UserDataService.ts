import {BaseService} from "../BaseService.ts";
import {UserStatus} from "../../domain/model/user/user.ts";

export class UserDataService extends BaseService {

    private static factory: UserDataService = new UserDataService();

    static get instance(): UserDataService {
        return UserDataService.factory;
    }

    constructor() {
        super('/users/data');
    }

    async getTotalByStatus(): Promise<Record<UserStatus, number>> {
        return super.get<Record<UserStatus, number>>('/grouped');
    }
}