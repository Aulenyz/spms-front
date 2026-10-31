import {Enrollment, EnrollmentStatus} from "../student/Enrollment.ts";

export enum InvoiceStatus {
    PENDING = "PENDING",
    PARTIAL = "PARTIAL",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    VOIDED = "VOIDED",
    CANCELLED = "CANCELLED",
}

export interface InvoiceSummary {
    id: number;
    number: string;
    ncf?: string;
    dueDate: string;
    total: number;
    due: number;
    status: InvoiceStatus;
}

/** Lo que cobraría inscribir a un estudiante en un curso, y qué falta para poder hacerlo. */
export interface EnrollmentPreview {
    conceptKey: "ENROLLMENT" | "RE_ENROLLMENT";
    conceptId: number;
    conceptName: string;
    price: number;
    taxAmount: number;
    total: number;
    billedTo?: string;
    resultingStatus: EnrollmentStatus;
    problems: string[];
}

export interface EnrollmentResult {
    enrollment: Enrollment;
    invoice: InvoiceSummary;
}

export const money = new Intl.NumberFormat("es-DO", {style: "currency", currency: "DOP", minimumFractionDigits: 2});
