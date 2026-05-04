import {environment} from "../../environment/environment.ts";
import {DocumentType, PublicRegisterUserFormValues} from "../../domain/model/user/user.ts";

const jsonHeaders = {
    "Content-Type": "application/json",
};

const parseJson = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const text = await response.text();
        try {
            throw JSON.parse(text);
        } catch {
            throw {message: text || response.statusText, status: response.status};
        }
    }
    return response.json() as Promise<T>;
};

export class PublicUserService {
    private static factory = new PublicUserService();

    static get instance(): PublicUserService {
        return PublicUserService.factory;
    }

    private readonly baseURL = `${environment.apiURL}/users`;

    async tokenIsValid(token: string): Promise<boolean> {
        const response = await fetch(`${this.baseURL}/token/${encodeURIComponent(token)}/valid`, {
            method: "GET",
            headers: jsonHeaders,
        });
        return parseJson<boolean>(response);
    }

    async existsByUsername(username: string): Promise<boolean> {
        const response = await fetch(`${this.baseURL}/username/${encodeURIComponent(username)}/exists`, {
            method: "GET",
            headers: jsonHeaders,
        });
        return parseJson<boolean>(response);
    }

    async existsByDocument(document: string, type: DocumentType, token: string): Promise<boolean> {
        const response = await fetch(
            `${this.baseURL}/document/${encodeURIComponent(document)}/type/${encodeURIComponent(type)}/exists?token=${encodeURIComponent(token)}`,
            {
                method: "GET",
                headers: jsonHeaders,
            }
        );
        return parseJson<boolean>(response);
    }

    async register(payload: PublicRegisterUserFormValues): Promise<void> {
        const response = await fetch(`${this.baseURL}/register`, {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const text = await response.text();
            try {
                throw JSON.parse(text);
            } catch {
                throw {message: text || response.statusText, status: response.status};
            }
        }
    }
}
