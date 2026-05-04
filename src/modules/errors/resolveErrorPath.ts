export const ERROR_500_PATH = "/errors/500";
export const ERROR_503_PATH = "/errors/503";

const NETWORK_MARKERS = [
    "failed to fetch",
    "load failed",
    "networkerror",
    "network error",
    "err_name_not_resolved",
    "dns_probe_finished_nxdomain",
];

export const isNetworkLikeError = (error?: unknown) => {
    if (!error) return false;

    if (typeof error === "object" && error !== null) {
        if ("status" in error && (error as {status?: number}).status === 503) return true;
        if (error instanceof TypeError) return true;
    }

    const message = typeof error === "string"
        ? error
        : typeof error === "object" && error !== null && "message" in error
            ? String((error as {message?: unknown}).message ?? "")
            : "";

    const normalized = message.trim().toLowerCase();
    return NETWORK_MARKERS.some((marker) => normalized.includes(marker));
};

export const resolveErrorPath = (error?: {status?: number}) => {
    if (error?.status === 503 || error?.status === 0) return ERROR_503_PATH;
    if ((error?.status ?? 0) >= 500) return ERROR_500_PATH;
    return undefined;
};
