import {useQuery} from "@tanstack/react-query";
import {OrganizationConfiguration, OrganizationConfigurationService} from "../../services/configuration/OrganizationConfigurationService.ts";
import {useCompany} from "../../contexts/CompanyContext.tsx";
import {queryKeys} from "../../app/query/queryKeys.ts";

const configurationService = OrganizationConfigurationService.instance;

/** Configuración de la organización activa (GET /organization/configurations). */
export const useOrganizationConfiguration = (options: { enabled?: boolean } = {}) => {
    const {rnc} = useCompany();
    return useQuery<OrganizationConfiguration[]>({
        queryKey: [...queryKeys.organizationConfiguration.all, rnc ?? null],
        queryFn: ({signal}) => configurationService.withSignal(signal).list(),
        enabled: Boolean(rnc) && (options.enabled ?? true),
        meta: {errorMessage: "No se pudo cargar la configuración de la organización."},
    });
};
