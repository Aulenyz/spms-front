import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {ERROR_503_PATH, isNetworkLikeError, resolveErrorPath} from "./resolveErrorPath.ts";

export const GlobalErrorGuard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const redirectToServiceError = () => {
            if (location.pathname === ERROR_503_PATH) return;
            navigate(ERROR_503_PATH, {replace: true});
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const errorPath = resolveErrorPath(reason as {status?: number});
            if (errorPath) {
                event.preventDefault();
                if (location.pathname !== errorPath) {
                    navigate(errorPath, {replace: true});
                }
                return;
            }

            if (isNetworkLikeError(reason)) {
                event.preventDefault();
                redirectToServiceError();
            }
        };

        const handleWindowError = (event: ErrorEvent) => {
            if (!isNetworkLikeError(event.error ?? event.message)) return;
            redirectToServiceError();
        };

        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        window.addEventListener("error", handleWindowError);

        return () => {
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
            window.removeEventListener("error", handleWindowError);
        };
    }, [location.pathname, navigate]);

    return null;
};
