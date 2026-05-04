import {BaseService} from "../BaseService.ts";

export type CurrentOrganizationDTO = {
    name?: string;
    logo?: string;
    document?: string;
};

export class OrganizationService extends BaseService<CurrentOrganizationDTO> {
    private static factory: OrganizationService = new OrganizationService();

    static get instance(): OrganizationService {
        return OrganizationService.factory;
    }

    constructor() {
        super("/organizations");
    }

    current(): Promise<CurrentOrganizationDTO> {
        return this.get<CurrentOrganizationDTO>("/current");
    }
}

