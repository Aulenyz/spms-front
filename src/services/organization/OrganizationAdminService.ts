import {BaseService} from "../BaseService.ts";
import {Organization} from "../../domain/model/organization/Organization.ts";

export class OrganizationAdminService extends BaseService<Organization> {
    private static factory = new OrganizationAdminService();

    static get instance() {
        return this.factory;
    }

    private constructor() {
        super("/organizations");
    }

    createOrganization(data: Partial<Organization>) {
        return super.create<Organization>("", data);
    }

    updateOrganization(id: number, data: Partial<Organization>) {
        return super.update<Organization, Organization>(id, data);
    }

    removeOrganization(id: number) {
        return super.deleteOne<void>(String(id));
    }

    updateStatus(id: number | string): Promise<Organization> {
        return this.put<Organization>(`/${id}/status`);
    }
}
