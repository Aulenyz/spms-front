import {QueryCache, QueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";

type ApiError = { status?: number, message?: string };

const statusOf = (error: unknown): number => Number((error as ApiError)?.status ?? 0);

/** Mensaje legible para un error de la API. */
export const apiErrorMessage = (error: unknown, fallback: string = "No se pudo cargar la información."): string => {
    const status = statusOf(error);
    if (status === 503 || status === 0) return "No fue posible conectar con el servidor.";
    if (status >= 500) return "Ocurrió un error en el servidor. Intenta nuevamente.";
    return (error as ApiError)?.message || fallback;
};

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            // 401 se gestiona en BaseService (redirige al login); `meta.silent` deja el manejo a la pantalla.
            if (statusOf(error) === 401 || query.meta?.silent) return;
            const message = apiErrorMessage(error, (query.meta?.errorMessage as string | undefined) ?? undefined);
            toast.error(message, {toastId: `query-error-${statusOf(error)}-${message}`});
        },
    }),
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Un reintento solo para fallos de red/5xx; nunca para errores 4xx.
            retry: (failureCount, error) => {
                const status = statusOf(error);
                if (status >= 400 && status < 500) return false;
                return failureCount < 1;
            },
        },
    },
});
