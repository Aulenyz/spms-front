export type EnvironmentProperty = {
    apiURL: string;
    /** Canal con el que la API identifica a este cliente (tabla iam.channel). */
    channel: string;
    production: boolean;
}

export const environment: EnvironmentProperty = {
    apiURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api/v1" : "http://localhost:8031/api/v1"),
    channel: import.meta.env.VITE_CHANNEL ?? "WEB",
    production: import.meta.env.PROD,
}

/** La API exige el canal en todas las peticiones; el token emitido solo sirve en ese canal. */
export const CHANNEL_HEADER = "X-Channel";

export const channelHeaders = (): Record<string, string> => ({[CHANNEL_HEADER]: environment.channel});
