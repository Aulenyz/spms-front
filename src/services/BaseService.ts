import {environment} from "../environment/environment";
import {getURI, joinURLParts} from "../utils/URIs";
import {isNil} from "lodash";
import {KeyValue, KeyValueOf, nonEmpty, Nullable, PlainValue} from "../domain/types/steoreotype.ts";
import {StorageItem} from "../domain/types/StorageItem.ts";
import {TokenInfo} from "../domain/model/auth/Token.ts";
import {Page, Pagination} from "../domain/filters/Page.ts";

export abstract class BaseService<R = unknown> {

    protected constructor(private readonly baseURL: string, private readonly isFull: boolean = false) {
    }

    findOne<T>(filter: KeyValue = {}): Promise<T> {
        return this.get<T>('/lookup', filter);
    }

    create<T>(endpoint: string, data: Partial<T>): Promise<R> {
        return this.post<R>(endpoint, data);
    }

    update<T, R>(id: number | undefined, data: Partial<T>): Promise<R> {
        return this.put<R>(`/${id}`, data ?? {});
    }

    deleteOne<R>(id: string | undefined): Promise<R> {
        return this.delete<R>(`/${id}`);
    }

    getOne(id?: string | number): Promise<R> {
        return this.get<R>(`/${id}`);
    }

    getAll(filters: Record<string, PlainValue> = {}, pagination: Pagination = Pagination.default): Promise<Page<R>> {
        return this.get<Page<R>>('', {...pagination, ...filters});
    }

    protected get<T>(endpoint: string = '', params: KeyValue = {}, headers: KeyValueOf<string> = {}): Promise<T> {
        const url: string = getURI((this.isFull ? '' : environment.apiURL) + this.baseURL + endpoint, params);
        const options: RequestInit = {headers, method: 'GET'};
        return this.execRequest<T>(url, options);
    }

    protected post<T>(endpoint: string = '', body: any = {}, headers: Record<string, string> = {}): Promise<T> {
        const url: string = (this.isFull ? '' : environment.apiURL) + this.baseURL + endpoint;
        const options: RequestInit = {method: 'POST', headers, body: JSON.stringify(body)};
        return this.execRequest<T>(url, options);
    }

    protected form<T>(endpoint: string = '', data: any = {}, headers: Record<string, string> = {}): Promise<T> {
        const formData = new URLSearchParams();
        Object.keys(data).forEach((key: string) => formData.append(key, data[key]));
        const url: string = getURI(joinURLParts(environment.apiURL, this.baseURL, endpoint));
        const options: RequestInit = {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded', ...headers},
            body: formData,
        };
        return this.execRequest<T>(url, options, false);
    }

    protected put<T>(endpoint: string = '', body?: any, headers: Record<string, string> = {}): Promise<T> {
        const url: string = (this.isFull ? '' : environment.apiURL) + this.baseURL + endpoint;
        const options: RequestInit = {method: 'PUT', headers, body: JSON.stringify(body)};
        return this.execRequest<T>(url, options);
    }

    protected delete<T>(endpoint: string = '', headers: Record<string, string> = {}): Promise<T> {
        const url: string = (this.isFull ? '' : environment.apiURL) + this.baseURL + endpoint;
        const options: RequestInit = {method: 'DELETE', headers};
        return this.execRequest<T>(url, options);
    }

    private execRequest<T>(url: string, options: RequestInit, isJson: boolean = true): Promise<T> {
        // Retrieves token info
        const info: Nullable<string> = localStorage.getItem(StorageItem.TokenInfo);
        const token: Nullable<TokenInfo> = info ? JSON.parse(info) : {};
        // Set headers value
        const headers: KeyValueOf<string> = (options?.headers as KeyValueOf<string>) ?? {}
        const companyRNC: string = localStorage.getItem(StorageItem.CompanyRNC) ?? '';
        isJson && (options.headers = {'Content-Type': 'application/json', ...options.headers});
        isNil(headers.authorization) && nonEmpty(token?.token) && (options.headers = {'authorization': 'Bearer ' + token?.token, ...options.headers});
        Boolean(companyRNC) && (options.headers = {'X-Auth-Company': companyRNC, ...options.headers});
        // Executes HTTP Call
        return new Promise<T>((resolve, reject): void => {
            fetch(url, options).then((response: Response) => this.handleResponse<T>(response))
                .then(resolve, reject)
                .catch(() => reject({status: 503, message: 'No fue posible conectar con el servidor.'}))
        });
    }

    private async handleResponse<T>(res: Response): Promise<T> {
        if (!res.ok) {
            const text: string = await res.text();
            let payload: any = {};
            try {
                payload = text ? JSON.parse(text) : {};
            } catch {
                payload = {message: text || res.statusText};
            }
            return Promise.reject({
                status: res.status,
                message: payload?.message || res.statusText,
                ...payload,
            });
        }
        try {
            const payload: T = await this.getPayload(res);
            return Promise.resolve(payload);
        } catch (e) {
            return Promise.reject({status: res.status, message: res.statusText, error: e});
        }
    }

    private async getPayload<T>(res: Response): Promise<T> {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return await res.json() as T;
        try {
            return await res.blob() as unknown as T;
        } catch (e) {
            return {} as T;
        }
    }
}
