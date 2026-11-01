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

/** Fecha de hoy en la hora local (yyyy-mm-dd); toISOString daría el día siguiente por la noche. */
export const localToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const money = new Intl.NumberFormat("es-DO", {style: "currency", currency: "DOP", minimumFractionDigits: 2});

export const InvoiceStatusLabel: Record<InvoiceStatus, string> = {
    [InvoiceStatus.PENDING]: "Pendiente",
    [InvoiceStatus.PARTIAL]: "Pago parcial",
    [InvoiceStatus.PAID]: "Pagada",
    [InvoiceStatus.OVERDUE]: "Vencida",
    [InvoiceStatus.VOIDED]: "Anulada",
    [InvoiceStatus.CANCELLED]: "Cancelada",
};

/** Tono visual de cada estado (clases `billing-pill-*`). */
export const InvoiceStatusTone: Record<InvoiceStatus, BillingTone> = {
    [InvoiceStatus.PENDING]: "warning",
    [InvoiceStatus.PARTIAL]: "info",
    [InvoiceStatus.PAID]: "success",
    [InvoiceStatus.OVERDUE]: "danger",
    [InvoiceStatus.VOIDED]: "muted",
    [InvoiceStatus.CANCELLED]: "muted",
};

export type BillingTone = "success" | "warning" | "danger" | "info" | "muted";

export enum PaymentMethod {
    CASH = "CASH",
    CARD = "CARD",
    TRANSFER = "TRANSFER",
    CHECK = "CHECK",
    OTHER = "OTHER",
}

export const PaymentMethodLabel: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: "Efectivo",
    [PaymentMethod.CARD]: "Tarjeta",
    [PaymentMethod.TRANSFER]: "Transferencia",
    [PaymentMethod.CHECK]: "Cheque",
    [PaymentMethod.OTHER]: "Otro",
};

export const PaymentMethodIcon: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: "fa-money-bill-wave",
    [PaymentMethod.CARD]: "fa-credit-card",
    [PaymentMethod.TRANSFER]: "fa-building-columns",
    [PaymentMethod.CHECK]: "fa-money-check",
    [PaymentMethod.OTHER]: "fa-wallet",
};

/** Formas de pago que exigen número de referencia. */
export const NEEDS_REFERENCE: PaymentMethod[] = [PaymentMethod.TRANSFER, PaymentMethod.CHECK];

export enum ReceiptStatus {
    PAID = "PAID",
    VOIDED = "VOIDED",
    REFUNDED = "REFUNDED",
}

export interface PersonRef {
    id: number;
    name: string;
    document?: string;
}

export interface Invoice {
    id: number;
    number: string;
    ncf?: string;
    student?: PersonRef;
    guardian?: PersonRef;
    emittedAt: string;
    dueDate?: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    paid: number;
    due: number;
    status: InvoiceStatus;
    manual: boolean;
    description?: string;
}

export interface InvoiceItem {
    id: number;
    productId?: number;
    code?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    amount: number;
    chargeDate?: string;
}

export interface InvoicePayment {
    id: number;
    receiptId?: number;
    receiptNumber?: string;
    invoiceId: number;
    invoiceNumber: string;
    description?: string;
    date: string;
    method: PaymentMethod;
    amount: number;
    status: ReceiptStatus;
}

export interface InvoiceDetails {
    invoice: Invoice;
    enrollmentId?: number;
    voidReason?: string;
    items: InvoiceItem[];
    payments: InvoicePayment[];
}

export interface Receipt {
    id: number;
    number: string;
    date: string;
    student: PersonRef;
    guardian?: PersonRef;
    method: PaymentMethod;
    reference?: string;
    amount: number;
    status: ReceiptStatus;
    createdAt: string;
}

export interface ReceiptDetails {
    receipt: Receipt;
    notes?: string;
    voidReason?: string;
    voidedAt?: string;
    receivedBy?: string;
    receivedById?: number;
    organization: {name: string; document?: string; logo?: string};
    payments: InvoicePayment[];
    /** Conceptos de las facturas que pagó (cada factura puede tener varios). */
    concepts: ReceiptConcept[];
}

export interface ReceiptConcept {
    invoiceId: number;
    invoiceNumber: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface AccountBalance {
    studentId: number;
    firstname: string;
    lastname: string;
    document?: string;
    billed: number;
    paid: number;
    due: number;
    overdue: number;
    openInvoices: number;
    oldestDueDate?: string;
}

export interface AccountMovement {
    date: string;
    type: "INVOICE" | "PAYMENT" | "VOIDED_PAYMENT";
    documentId: number;
    document: string;
    description?: string;
    charge?: number;
    payment?: number;
    balance: number;
}

export interface AccountStatement {
    student: PersonRef;
    guardian?: PersonRef;
    billed: number;
    paid: number;
    due: number;
    overdue: number;
    invoices: Invoice[];
    receipts: Receipt[];
    movements: AccountMovement[];
}

export interface BillingSummary {
    billedThisPeriod: number;
    collectedThisPeriod: number;
    collectedThisMonth: number;
    collectedToday: number;
    outstanding: number;
    overdue: number;
    openInvoices: number;
    overdueInvoices: number;
    pendingEnrollments: number;
    months: {month: string; billed: number; collected: number}[];
    methods: {method: PaymentMethod; amount: number; count: number}[];
    topDebtors: AccountBalance[];
    latestReceipts: Receipt[];
}

export interface PaymentFormValues {
    studentId: number;
    guardianId?: number;
    date?: string;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    amount?: number;
    allocations?: {invoiceId: number; amount: number}[];
}

/** Una transacción de caja: conceptos que se venden ahora, facturas pendientes que se pagan y lo recibido. */
export interface CheckoutValues {
    studentId: number;
    guardianId?: number;
    method: PaymentMethod;
    reference?: string;
    date?: string;
    notes?: string;
    discount?: number;
    /** Al precio del concepto; en la caja no se cambia. Un concepto periódico usa `quantity` como periodos. */
    items: {productId: number; quantity: number}[];
    invoiceIds: number[];
    /** Inscribe al estudiante en este curso y cobra la inscripción primero. */
    enrollCourseId?: number;
    received: number;
}

/** Situación del estudiante en el periodo actual: la caja exige la inscripción antes de otros conceptos. */
export interface EnrollmentStanding {
    state: "NO_PERIOD" | "NOT_ENROLLED" | "PENDING" | "ENROLLED";
    periodName?: string;
    enrollmentId?: number;
    courseName?: string;
    invoiceId?: number;
    invoiceNumber?: string;
    invoiceDue?: number;
    conceptKey?: string;
    conceptName?: string;
    conceptPrice?: number;
}

export interface CheckoutResult {
    invoice?: InvoiceDetails;
    receipt?: ReceiptDetails;
    change: number;
}

export interface InvoiceFormValues {
    studentId: number;
    dueDate?: string;
    notes?: string;
    items: {productId: number; quantity: number; unitPrice?: number}[];
}

export const formatDate = (value?: string) =>
    value ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString("es-DO", {day: "2-digit", month: "short", year: "numeric"}) : "—";

/** Enlaces a una factura o un recibo: la lista filtrada por su número, con ese elemento abierto. */
export const invoiceLink = (number: string) => `/invoices/list?q=${encodeURIComponent(number)}`;
export const receiptLink = (number: string) => `/payments/list?q=${encodeURIComponent(number)}`;
