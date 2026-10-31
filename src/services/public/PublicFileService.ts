import {environment} from "../../environment/environment.ts";
import {readStoredToken} from "../BaseService.ts";

type ResultResponse<T> = {
    result: T;
};

export class PublicFileService {
    private static factory = new PublicFileService();

    static get instance(): PublicFileService {
        return PublicFileService.factory;
    }

    /**
     * Sube una imagen. Con sesión iniciada usa el token de la sesión; durante el registro por
     * invitación (sin sesión) la API exige el token de la invitación.
     */
    async upload(file: File, invitationToken?: string): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        if (invitationToken) formData.append("token", invitationToken);
        const sessionToken = readStoredToken()?.token;

        try {
            const response = await fetch(`${environment.apiURL}/files/upload`, {
                method: "POST",
                body: formData,
                headers: sessionToken ? {authorization: `Bearer ${sessionToken}`} : undefined,
            });

            if (!response.ok) {
                const text = await response.text();
                try {
                    throw JSON.parse(text);
                } catch {
                    throw {message: text || response.statusText, status: response.status};
                }
            }

            const payload = await response.json() as ResultResponse<string>;
            return payload.result;
        } catch (error) {
            if (typeof error === "object" && error !== null && "status" in error) throw error;
            throw {status: 503, message: "No fue posible conectar con el sistema."};
        }
    }
}
