import {BaseService} from "../BaseService.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";
import {Optional, PlainValue, ResultResponse} from "../../domain/types/steoreotype.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {getURI} from "../../utils/URIs.ts";
import {environment} from "../../environment/environment.ts";
import {StorageItem} from "../../domain/types/StorageItem.ts";
import {TokenInfo} from "../../domain/model/auth/Token.ts";
import {Nullable} from "../../domain/types/steoreotype.ts";

export class UserService extends BaseService<User> {

    private static factory: UserService = new UserService();

    static get instance(): UserService {
        return UserService.factory;
    }

    constructor() {
        super('/users');
    }

    async current(): Promise<User> {
        return super.get<User>('/current');
    }

    existsByDocument(document: string) {
        return super.post<ResultResponse<boolean>>(`/document/${document}/exists`)
            .then(({result}: ResultResponse<boolean>) => !result, () => true);
    }

    existsByEmail(email: string) {
        return super.post<ResultResponse<boolean>>(`/email/${email}/exists`)
            .then(({result}: ResultResponse<boolean>) => !result, () => true);
    }
    existsByEmailEdit(email: string, id: number) {
        return super.post<ResultResponse<boolean>>(`/email/${email}/${id}/exists`)
            .then(({result}: ResultResponse<boolean>) => !result, () => false);
    }
    existsByDocumentEdit(document: string,id: number) {
        return super.post<ResultResponse<boolean>>(`/document/${document}/${id}/exists`)
            .then(({result}: ResultResponse<boolean>) => !result, () => true);
    }

    existsByUsername(username: string) {
        return super.post<ResultResponse<boolean>>(`/username/${username}/exists`)
            .then(({result}: ResultResponse<boolean>) => !result, () => true);
    }

    existsByUsernameEdit(username: string, id: number) {
        return super.post<ResultResponse<boolean>>(`/username/${username}/${id}/exists`)
            .then(({result}: ResultResponse<boolean>) => !result, () => false);
    }

    changeStatusUser(id: number, status: UserStatus, comment: string): Promise<ResultResponse<any>> {
        return super.put<ResultResponse<any>>(`/${id}/status/`, {status, comments: comment});
    }

    search(filters: Record<string, Optional<PlainValue>> = {}, pagination: Pagination = Pagination.default): Promise<Page<User>> {
        return this.get<Page<User>>('/search', {...pagination, ...filters});
    }

    updateFCMToken(token: string) {
        return super.post('/tokens', {token, platformType: 'WEB'})
    }

    getInvitations(email: string) {
        return super.get('/user/invitations', {email});
    }

    async resendInvitation(email: string): Promise<ResultResponse<any>> {
        const url = getURI(environment.apiURL + '/user/invitations/resend', {email});
        const info: Nullable<string> = localStorage.getItem(StorageItem.TokenInfo);
        const token: Nullable<TokenInfo> = info ? JSON.parse(info) : {};
        const companyRNC: string = localStorage.getItem(StorageItem.CompanyRNC) ?? '';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token && typeof token.token === 'string' && token.token.trim() !== '') {
            headers['authorization'] = 'Bearer ' + token.token;
        }


        if (companyRNC) {
            headers['X-Auth-Company'] = companyRNC;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const text = await response.text();
            const payload = JSON.parse(text);
            return Promise.reject(payload);
        }

        return await response.json();
    }
}