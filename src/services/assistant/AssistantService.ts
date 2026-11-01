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
    /** Descripción sugerida por la IA; para materias también un código que no usa otra materia. */
    /** Nota del recibo escrita por la IA a partir de lo que cubre el pago (sin nombres de personas). */
    paymentNote(request: {concepts: string[]; invoices: string[]; method: string; discount: boolean; partial: boolean}): Promise<{note: string}> {
        return this.post<{note: string}>("/payment-note", request);
    }

    describe(kind: "specialization" | "subject", name: string, detail?: string): Promise<{description: string; code?: string | null}> {
        return this.post<{description: string; code?: string | null}>("/describe", {kind, name, detail});
    }

    chat(messages: ChatMessage[]): Promise<ChatReply> {
        return this.post<ChatReply>("/chat", {messages});
    }
}
