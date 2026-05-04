import {environment} from "../../environment/environment.ts";

type ResultResponse<T> = {
    result: T;
};

export class PublicFileService {
    private static factory = new PublicFileService();

    static get instance(): PublicFileService {
        return PublicFileService.factory;
    }

    async upload(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${environment.apiURL}/files/upload`, {
                method: "POST",
                body: formData,
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
