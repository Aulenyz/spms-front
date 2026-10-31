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
    /** IA que respondió (puede ser una de respaldo). */
    provider?: string;
}

export interface AssistantStatus {
    enabled: boolean;
    /** IAs configuradas, en el orden en que se prueban. */
    providers: string[];
}

export class AssistantService extends BaseService<ChatReply> {
    private static factory = new AssistantService();

    static get instance(): AssistantService {
        return AssistantService.factory;
    }

    constructor() {
        super("/assistant");
    }

    status(): Promise<AssistantStatus> {
        return this.get<AssistantStatus>("/status");
    }

    /** Descripción escrita por la IA para un registro que se está creando (p. ej. un área especializada). */
    describe(kind: "specialization", name: string, detail?: string): Promise<{description: string}> {
        return this.post<{description: string}>("/describe", {kind, name, detail});
    }

    chat(messages: ChatMessage[]): Promise<ChatReply> {
        return this.post<ChatReply>("/chat", {messages});
    }
}
