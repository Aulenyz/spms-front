import {useQuery} from "@tanstack/react-query";
import {AccountService, BillingSettings} from "../../services/billing/BillingService.ts";
import {useCompany} from "../../contexts/CompanyContext.tsx";

export const billingSettingsKey = (rnc?: string) => ["billing", "settings", rnc ?? null] as const;

/** Ajustes de facturación de la organización actual (impuestos, NCF). Mientras carga, impuestos apagados. */
export const useBillingSettings = (): BillingSettings => {
    const {rnc} = useCompany();
    const {data} = useQuery({
        queryKey: billingSettingsKey(rnc),
        queryFn: ({signal}) => AccountService.instance.withSignal(signal).settings(),
        enabled: Boolean(rnc),
        staleTime: 5 * 60 * 1000,
        meta: {silent: true},
    });
    return data ?? {taxesEnabled: false, requiresNcf: false};
};
