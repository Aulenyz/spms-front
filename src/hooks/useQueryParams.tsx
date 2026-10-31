import {useMemo} from "react";
import {useSearchParams} from "react-router-dom";

/** Parámetros de la query string actual como objeto plano (reactivo a la navegación). */
export const useQueryParams = (): Record<string, string> => {
    const [searchParams] = useSearchParams();
    return useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
}
