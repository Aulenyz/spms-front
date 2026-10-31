import {BaseService} from "../BaseService.ts";
import {PaymentMethod} from "../../domain/billing/Invoice.ts";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
    role: ChatRole;
    content: string;
}

/** Pago preparado por el asistente: no se registra hasta que el usuario lo confirma. */
export interface PaymentDraft {
    studentId: number;
    studentName: string;
    method: PaymentMethod;
    reference?: string;
    total: number;
    lines: {invoiceId: number; invoiceNumber: string; description?: string; amount: number}[];
}

export interface ChatReply {
    reply: string;
    drafts: PaymentDraft[];
}

export class AssistantService extends BaseService<ChatReply> {
    private static factory = new AssistantService();

    static get instance(): AssistantService {
        return AssistantService.factory;
    }

    constructor() {
        super("/assistant");
    }

    status(): Promise<{enabled: boolean}> {
        return this.get<{enabled: boolean}>("/status");
    }

    chat(messages: ChatMessage[]): Promise<ChatReply> {
        return this.post<ChatReply>("/chat", {messages});
    }
}
