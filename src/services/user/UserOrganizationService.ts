import {BaseService} from "../BaseService";
import {UserOrganizationDTO} from "../../domain/model/user/UserOrganizationDTO.tsx";

export class UserOrganizationService extends BaseService<UserOrganizationDTO> {
    private static _instance: UserOrganizationService = new UserOrganizationService();

    public static get instance(): UserOrganizationService {
        return UserOrganizationService._instance;
    }

    constructor() {
        super("/users/organizations");
    }

    async current(): Promise<UserOrganizationDTO> {
        return super.get<UserOrganizationDTO>("/current");
    }
}
