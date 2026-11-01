import {BaseService} from "../BaseService.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";
import {UserChannel} from "../../domain/model/user/UserChannel.ts";

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

    /** Apps que se habilitan por usuario en la organización activa, con su estado para este usuario. */
    channels(id: number | string): Promise<UserChannel[]> {
        return this.get<UserChannel[]>(`/${id}/channels`);
    }

    grantChannel(id: number | string, key: string): Promise<UserChannel> {
        return this.put<UserChannel>(`/${id}/channels/${encodeURIComponent(key)}`);
    }

    revokeChannel(id: number | string, key: string): Promise<UserChannel> {
        return this.delete<UserChannel>(`/${id}/channels/${encodeURIComponent(key)}`);
    }
}
