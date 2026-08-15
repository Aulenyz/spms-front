import {BaseService} from "../BaseService.ts";

export type OrganizationConfiguration = {
    id: number;
    name: string;
    description?: string;
    dataType: "BOOLEAN" | "INTEGER" | "DECIMAL" | "TEXT" | "DATE";
    value?: string;
};

export class OrganizationConfigurationService extends BaseService<OrganizationConfiguration> {
    private static factory = new OrganizationConfigurationService();

    static get instance() {
        return OrganizationConfigurationService.factory;
    }

    private constructor() {
        super("/organization/configurations");
    }

    list(): Promise<OrganizationConfiguration[]> {
        return this.get<OrganizationConfiguration[]>("");
    }

    save(name: string, value: string): Promise<OrganizationConfiguration> {
        return this.put<OrganizationConfiguration>(`/${name}`, {value});
    }

    generateSchoolYear(end: string): Promise<unknown> {
        return this.post<unknown>("/school-year/generate", {end});
    }
}
