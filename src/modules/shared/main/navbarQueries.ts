import {useQuery} from "@tanstack/react-query";
import {UserOrganizationService} from "../../../services/user/UserOrganizationService.ts";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import {CurrentOrganizationDTO, OrganizationService} from "../../../services/organization/OrganizationService.ts";
import {useCompany} from "../../../contexts/CompanyContext.tsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";

/** Espacios de trabajo (organizaciones) del usuario actual. */
export const useMyOrganizations = () => useQuery<UserOrganizationDTO[]>({
    queryKey: queryKeys.organizations.mine,
    queryFn: async ({signal}) => {
        const res = await UserOrganizationService.instance.withSignal(signal).current();
        return Array.isArray(res) ? res : (res?.organization ? [res] : []);
    },
    meta: {silent: true},
});

/** Organización activa según X-Auth-Company. */
export const useCurrentOrganization = () => {
    const {rnc} = useCompany();
    return useQuery<CurrentOrganizationDTO | null>({
        queryKey: [...queryKeys.organizations.all, "current", rnc ?? null],
        queryFn: async ({signal}) => (await OrganizationService.instance.withSignal(signal).current()) ?? null,
        meta: {silent: true},
    });
};
