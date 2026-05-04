import {BaseService} from "../BaseService.ts";
import {KeyValue} from "../../domain/types/steoreotype.ts";
import {StorageItem} from "../../domain/types/StorageItem.ts";
import {AuthToken, TokenInfo, TokenResponse} from "../../domain/model/auth/Token.ts";
import {User} from "../../domain/model/user/user.ts";
import {LocalStorage} from "../../utils/LocalStorage.ts";

export class AuthService extends BaseService {

    private static factory: AuthService = new AuthService();

    static get instance(): AuthService {
        return AuthService.factory;
    }

    constructor() {
        super('/auth');
    }

    async currentUser(): Promise<User> {
        return super.get<User>('/current');
    }

    async authenticate(username: string, password: string): Promise<AuthToken> {
        const request: KeyValue = {username, password, grant_type: 'password'};
        const endpoint: string = '/token';
        const {token}: TokenResponse = await this.form<TokenResponse>(endpoint, request, {
            authorization: 'Basic ' + btoa(`${username}:${password}`)
        });
        return this.saveToken(token).info;
    }

    async refreshToken(): Promise<TokenInfo> {
        const response = await this.get<TokenResponse | TokenInfo>("/token/refresh");
        return this.saveToken(response.token);
    }

    get current(): AuthToken {
        return this.getTokenInfo().info;
    }

    getTokenInfo(): TokenInfo {
        return LocalStorage.getObject<TokenInfo>(StorageItem.TokenInfo, {
            token: "",
            info: {
                id: "",
                expiresAt: 0,
                authorities: [],
            } as AuthToken,
        });
    }

    logout(): void {
        const rnc: string = localStorage.getItem(StorageItem.CompanyRNC)!;
        localStorage.clear();
        localStorage.setItem(StorageItem.CompanyRNC, rnc);
    }

    private saveToken(token: string): TokenInfo {
        const previous = this.getTokenInfo().info;
        const current = this.mapTokenToInfo(token);
        const info: AuthToken = {
            id: current.id || previous.id,
            company: current.company ?? previous.company,
            name: current.name ?? previous.name,
            role: current.role ?? previous.role,
            expiresAt: current.expiresAt || previous.expiresAt,
            authorities: current.authorities,
        };
        const tokenInfo: TokenInfo = {info, token};
        localStorage.setItem(StorageItem.TokenInfo, JSON.stringify(tokenInfo));
        return tokenInfo;
    }

    private mapTokenToInfo(token: string): AuthToken {
        const base64Url: string = token.split('.')[1];
        const base64: string = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload: string = decodeURIComponent(atob(base64).split('').map((c: string): string =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const payload = JSON.parse(jsonPayload);
        return {
            id: payload.sub,
            company: payload.company,
            name: payload.user,
            role: payload.role,
            expiresAt: payload.exp * 1000,
            authorities: Array.isArray(payload.authorities) ? payload.authorities : []
        };
    }
}
