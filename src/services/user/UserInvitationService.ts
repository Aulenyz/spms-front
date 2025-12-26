import {BaseService} from "../BaseService.ts";
import {UserInvitation} from "../../domain/model/user/user.ts";

export class UserInvitationService extends BaseService<UserInvitation> {

    private static factory: UserInvitationService = new UserInvitationService();

    static get instance(): UserInvitationService {
        return UserInvitationService.factory;
    }

    constructor() {
        super('/users/invitations');
    }

    async existsByEmail(email: string): Promise<boolean> {
        const res = await this.get<{ result: boolean; }>(`/email/${email}/exists`);
        return res.result;
    }
}