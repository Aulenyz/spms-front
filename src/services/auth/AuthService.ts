import {BaseService} from "../BaseService.ts";
import {KeyValue} from "../../domain/types/steoreotype.ts";
import {StorageItem} from "../../domain/types/StorageItem.ts";
import {AuthToken, TokenInfo, TokenResponse} from "../../domain/model/auth/Token.ts";
import {User} from "../../domain/model/user/user.ts";

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
        const info: AuthToken = this.mapTokenToInfo(token);
        const tokenInfo: TokenInfo = {info, token};
        localStorage.setItem(StorageItem.TokenInfo, JSON.stringify(tokenInfo));
        return info;
    }

    get current(): AuthToken {
        const tokenInfo: TokenInfo = JSON.parse(localStorage.getItem(StorageItem.TokenInfo) ?? '{}') as TokenInfo;
        return tokenInfo.info;
    }

    logout(): void {
        const rnc: string = localStorage.getItem(StorageItem.CompanyRNC)!;
        localStorage.clear();
        localStorage.setItem(StorageItem.CompanyRNC, rnc);
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
            expiresAt: payload.exp * 1000
        };
    }
}