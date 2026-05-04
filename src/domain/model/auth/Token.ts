export interface AuthToken {
    id: string;
    company?: string;
    name?: string;
    role?: string;
    expiresAt: number;
    authorities: string[];
}

export interface TokenResponse {
    token: string;
}

export type TokenInfo = TokenResponse & { info: AuthToken }
