export type EnvironmentProperty = {
    apiURL: string;
    production: boolean;
}

export const environment: EnvironmentProperty = {
    apiURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api/v1" : "http://localhost:8031/api/v1"),
    production: import.meta.env.PROD,
}
