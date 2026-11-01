import {channelHeaders, environment} from "../environment/environment";
import {getURI, joinURLParts} from "../utils/URIs";
import {isNil} from "../utils/lang.ts";
import {KeyValue, KeyValueOf, nonEmpty, Nullable, PlainValue} from "../domain/types/steoreotype.ts";
import {StorageItem} from "../domain/types/StorageItem.ts";
import {TokenInfo} from "../domain/model/auth/Token.ts";
import {Page, Pagination} from "../domain/filters/Page.ts";

export abstract class BaseService<R = unknown> {

    /**
     * Acción ante un 401 de la API (excepto el login). Por defecto limpia la sesión y redirige a
     * `/auth/login`; la app la reemplaza (ver AuthContext) para hacerlo sin recargar la página.
     */
    static unauthorizedHandler: () => void = () => defaultUnauthorizedHandler();

    private requestSignal?: AbortSignal;

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

    /**
     * Devuelve una vista de este servicio cuyas peticiones usan la señal indicada
     * (p. ej. la `signal` que entrega react-query) para poder cancelarse.
     */
    withSignal(signal?: AbortSignal): this {
        if (!signal) return this;
        const scoped = Object.create(this) as this;
        (scoped as BaseService<R>).requestSignal = signal;
        return scoped;
    }

    private async execRequest<T>(url: string, options: RequestInit, isJson: boolean = true): Promise<T> {
        const token: Nullable<TokenInfo> = readStoredToken();
        const headers: KeyValueOf<string> = (options?.headers as KeyValueOf<string>) ?? {};
        const companyId: string = readCompanyId();
        if (isJson) options.headers = {'Content-Type': 'application/json', ...options.headers};
        if (isNil(headers.authorization) && nonEmpty(token?.token)) {
            options.headers = {'authorization': 'Bearer ' + token?.token, ...options.headers};
        }
        if (companyId) options.headers = {'X-Auth-Company': companyId, ...options.headers};
        options.headers = {...channelHeaders(), ...options.headers};
        if (this.requestSignal) options.signal = this.requestSignal;

        let response: Response;
        try {
            response = await fetch(url, options);
        } catch (error) {
            if (isAbortError(error)) throw error;
            throw {status: 503, message: 'No fue posible conectar con el servidor.'};
        }
        return this.handleResponse<T>(response, url);
    }

    private async handleResponse<T>(res: Response, url: string): Promise<T> {
        if (!res.ok) {
            if (res.status === 401 && !isLoginRequest(url)) {
                BaseService.unauthorizedHandler();
            }
            const text: string = await res.text();
            let payload: any = {};
            try {
                payload = text ? JSON.parse(text) : {};
            } catch {
                payload = {message: isHtml(res) ? res.statusText : (text || res.statusText)};
            }
            return Promise.reject({
                status: res.status,
                message: payload?.message || res.statusText,
                ...payload,
            });
        }
        if (isHtml(res)) {
            // Una página HTML como respuesta de la API suele indicar una URL/proxy mal configurado.
            return Promise.reject({status: 502, message: 'El servidor devolvió una respuesta inesperada.'});
        }
        try {
            const payload: T = await this.getPayload(res);
            return Promise.resolve(payload);
        } catch (e) {
            if (isAbortError(e)) throw e;
            return Promise.reject({status: res.status, message: res.statusText, error: e});
        }
    }

    private async getPayload<T>(res: Response): Promise<T> {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return await res.json() as T;
        try {
            return await res.blob() as unknown as T;
        } catch (e) {
            if (isAbortError(e)) throw e;
            return {} as T;
        }
    }
}

const LOGIN_PATH: string = '/auth/login';

/** Cache del token parseado: evita JSON.parse en cada petición mientras el valor no cambie. */
let cachedTokenRaw: Nullable<string>;
let cachedToken: Nullable<TokenInfo>;

export const readStoredToken = (): Nullable<TokenInfo> => {
    const raw: Nullable<string> = localStorage.getItem(StorageItem.TokenInfo);
    if (raw === cachedTokenRaw) return cachedToken;
    cachedTokenRaw = raw;
    try {
        cachedToken = raw ? JSON.parse(raw) as TokenInfo : undefined;
    } catch {
        cachedToken = undefined;
    }
    return cachedToken;
};

/** Id de la organización activa (user_organization) o cadena vacía si no hay una válida. */
export const readCompanyId = (): string => {
    const value: string = (localStorage.getItem(StorageItem.CompanyRNC) ?? '').trim();
    return value && value !== 'null' && value !== 'undefined' ? value : '';
};

const isAbortError = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';

const isHtml = (res: Response): boolean => (res.headers.get('content-type') || '').includes('text/html');

const isLoginRequest = (url: string): boolean => url.split('?')[0].replace(/\/+$/, '').endsWith('/auth/token');

const defaultUnauthorizedHandler = (): void => {
    localStorage.removeItem(StorageItem.TokenInfo);
    if (!window.location.pathname.startsWith('/auth/')) {
        window.location.assign(LOGIN_PATH);
    }
};
