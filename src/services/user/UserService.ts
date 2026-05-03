import {BaseService} from "../BaseService.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";

export class UserService extends BaseService<User> {

    private static factory: UserService = new UserService();

    static get instance(): UserService {
        return UserService.factory;
    }

    constructor() {
        super('/users');
    }

    updateStatus(id: number | string, status: UserStatus): Promise<User> {
        // Backend expects a raw enum in the request body.
        return this.put<User>(`/${id}/status`, status);
    }

    async current(): Promise<User> {
        return super.get<User>('/current');
    }

    async getTotalByStatus(): Promise<Record<UserStatus, number>> {
        return super.get<Record<UserStatus, number>>('/grouped');
    }
}
