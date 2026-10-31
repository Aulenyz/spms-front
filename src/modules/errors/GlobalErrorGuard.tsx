import {useEffect} from "react";
import {toast} from "react-toastify";
import {isNetworkLikeError, resolveErrorPath} from "./resolveErrorPath.ts";
import {apiErrorMessage} from "../../app/query/queryClient.ts";

/**
 * Red de seguridad para promesas rechazadas sin manejar (llamadas a servicios fuera de react-query).
 * Antes redirigía a /errors/500 o /errors/503 desde cualquier pantalla; ahora notifica con un toast y
 * deja al usuario en la pantalla actual. Las páginas de error completas quedan para fallos de ruta
 * (ver RouteErrorBoundary) y para la validación de sesión en AuthContext.
 */
export const GlobalErrorGuard = () => {
    useEffect(() => {
        const notify = (reason: unknown) => {
            const message = apiErrorMessage(reason);
            toast.error(message, {toastId: `unhandled-${message}`});
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            if ((reason as { name?: string })?.name === "AbortError") {
                event.preventDefault();
                return;
            }
            if (resolveErrorPath(reason as { status?: number }) || isNetworkLikeError(reason)) {
                event.preventDefault();
                notify(reason);
            }
        };

        const handleWindowError = (event: ErrorEvent) => {
            if (!isNetworkLikeError(event.error ?? event.message)) return;
            notify(event.error ?? event.message);
        };

        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        window.addEventListener("error", handleWindowError);

        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
            window.removeEventListener("error", handleWindowError);
        };
    }, []);

    return null;
};
