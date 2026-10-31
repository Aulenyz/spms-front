import {useQuery} from "@tanstack/react-query";
import {PeriodService} from "../../services/period/PeriodService.ts";
import {Period} from "../../domain/model/organization/Organization.tsx";
import {useCompany} from "../../contexts/CompanyContext.tsx";
import {queryKeys} from "../../app/query/queryKeys.ts";

const periodService: PeriodService = PeriodService.instance;

/**
 * Periodo académico vigente de la organización activa. Compartido por toda la app vía react-query:
 * las consultas que dependen del periodo deben usar `enabled: Boolean(period?.id)`.
 */
export const useCurrentPeriod = (options: { enabled?: boolean, silent?: boolean } = {}) => {
    const {rnc} = useCompany();
    return useQuery<Period>({
        queryKey: queryKeys.period.current(rnc),
        queryFn: ({signal}) => periodService.withSignal(signal).current(),
        enabled: Boolean(rnc) && (options.enabled ?? true),
        staleTime: 5 * 60_000,
        meta: {silent: options.silent ?? false, errorMessage: "No se pudo obtener el periodo actual."},
    });
};
