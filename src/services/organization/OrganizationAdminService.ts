import {BaseService} from "../BaseService.ts";
import {Organization, OrganizationInvitation, OrganizationUser} from "../../domain/model/organization/Organization.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";

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

    users(id: number | string, pagination: Pagination): Promise<Page<OrganizationUser>> {
        return this.get<Page<OrganizationUser>>(`/${id}/users`, {...pagination});
    }

    invitations(id: number | string, pagination: Pagination): Promise<Page<OrganizationInvitation>> {
        return this.get<Page<OrganizationInvitation>>(`/${id}/invitations`, {...pagination});
    }

    roles(id: number | string): Promise<Page<{id: number; name: string; description?: string}>> {
        return this.get<Page<{id: number; name: string; description?: string}>>(`/${id}/roles`, {page: 0, size: 100, sort: "name,asc"});
    }

    invite(id: number | string, data: {email: string; roleId: number}): Promise<void> {
        return this.post<void>(`/${id}/users/invitations`, data);
    }

    createRole(id: number | string, data: {name: string; description: string}): Promise<void> {
        return this.post<void>(`/${id}/roles`, data);
    }
}
