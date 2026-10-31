import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {OrganizationConfiguration} from "../../../services/configuration/OrganizationConfigurationService.ts";
import {useOrganizationConfiguration} from "../../../hooks/queries/useOrganizationConfiguration.ts";
import {useCurrentPeriod} from "../../../hooks/queries/useCurrentPeriod.ts";
import {configurationValue} from "./navbarUtils.ts";

const EMPTY: OrganizationConfiguration[] = [];

/** Configuración de la organización + periodo vigente, solo para usuarios con permiso de configuración. */
export const useSchoolCalendar = () => {
    const {hasAuthority} = useAuthContext();
    const canConfigure = hasAuthority(AuthorityKey.CONFIGURATION);
    const configurationQuery = useOrganizationConfiguration({enabled: canConfigure});
    const periodQuery = useCurrentPeriod({enabled: canConfigure, silent: true});
    const settings = configurationQuery.data ?? EMPTY;
    const currentPeriod = periodQuery.isError ? null : periodQuery.data ?? null;

    return {
        canConfigure,
        configurationQuery,
        settings,
        currentPeriod,
        ready: canConfigure && configurationQuery.isFetched && periodQuery.isFetched,
        automaticSchoolYear: configurationValue(settings, "AUTO_CREATE_SCHOOL_YEAR") === "true",
        hasActiveSchoolYear: Boolean(currentPeriod?.isActive),
    };
};
