import {BaseService} from "../BaseService.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";
import {Optional, PlainValue, ResultResponse} from "../../domain/types/steoreotype.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";

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
}