import {BaseService} from "../BaseService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {
    AccountBalance,
    AccountMovement,
    AccountStatement,
    BillingSummary,
    CheckoutResult,
    CheckoutValues,
    Invoice,
    InvoiceDetails,
    InvoiceStatus,
    PaymentFormValues,
    PaymentMethod,
    Receipt,
    ReceiptDetails,
    ReceiptStatus,
} from "../../domain/billing/Invoice.ts";

export type BillingSettings = {taxesEnabled: boolean; requiresNcf: boolean};

export type InvoiceFilters = {term?: string; status?: InvoiceStatus; studentId?: number; open?: boolean; from?: string; to?: string};
export type ReceiptFilters = {term?: string; status?: ReceiptStatus; method?: PaymentMethod; studentId?: number; from?: string; to?: string};

const params = (filters: object, pagination: Pagination) => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ""));
    return {page: pagination.page, size: pagination.size, ...clean};
};

/** Un periodo por cobrar, p. ej. {date: "2026-11-01", description: "Mensualidad noviembre 2026"}. */
export type UpcomingCharge = {date: string; description: string};

export class InvoiceService extends BaseService<Invoice> {
    private static factory = new InvoiceService();

    static get instance(): InvoiceService {
        return InvoiceService.factory;
    }

    constructor() {
        super("/invoices");
    }

    search(filters: InvoiceFilters, pagination: Pagination): Promise<Page<Invoice>> {
        return this.get<Page<Invoice>>("/search", params(filters, pagination));
    }

    /** Excel con las facturas del filtro emitidas en el rango `from`–`to` (máximo 3 meses). */
    exportExcel(filters: InvoiceFilters): Promise<Blob> {
        return this.get<Blob>("/export", params(filters, Pagination.first));
    }

    /** Periodos de un concepto periódico que aún no se le cobran al estudiante en el periodo escolar. */
    upcoming(studentId: number, productId: number): Promise<UpcomingCharge[]> {
        return this.get<UpcomingCharge[]>("/upcoming", {studentId, productId});
    }

    /** Facturas con saldo de un estudiante, para registrar un pago. */
    open(studentId: number): Promise<Page<Invoice>> {
        return this.search({studentId, open: true}, {...Pagination.first, size: 50});
    }

    details(id: number | string): Promise<InvoiceDetails> {
        return this.get<InvoiceDetails>(`/${id}`);
    }

    voidInvoice(id: number, reason: string): Promise<InvoiceDetails> {
        return this.put<InvoiceDetails>(`/${id}/void`, {reason});
    }
}

export class ReceiptService extends BaseService<Receipt> {
    private static factory = new ReceiptService();

    static get instance(): ReceiptService {
        return ReceiptService.factory;
    }

    constructor() {
        super("/payments");
    }

    search(filters: ReceiptFilters, pagination: Pagination): Promise<Page<Receipt>> {
        return this.get<Page<Receipt>>("/search", params(filters, pagination));
    }

    /** Excel con los recibos del filtro del rango `from`–`to` (máximo 3 meses). */
    exportExcel(filters: ReceiptFilters): Promise<Blob> {
        return this.get<Blob>("/export", params(filters, Pagination.first));
    }

    details(id: number | string): Promise<ReceiptDetails> {
        return this.get<ReceiptDetails>(`/${id}`);
    }

    register(values: PaymentFormValues): Promise<ReceiptDetails> {
        return this.post<ReceiptDetails>("", values);
    }

    /** Caja: factura los conceptos y cobra todo en una sola operación. */
    checkout(values: CheckoutValues): Promise<CheckoutResult> {
        return this.post<CheckoutResult>("/checkout", values);
    }

    voidReceipt(id: number, reason: string): Promise<ReceiptDetails> {
        return this.put<ReceiptDetails>(`/${id}/void`, {reason});
    }
}

export class AccountService extends BaseService<AccountBalance> {
    private static factory = new AccountService();

    static get instance(): AccountService {
        return AccountService.factory;
    }

    constructor() {
        super("/billing");
    }

    balances(term: string, withDebt: boolean, pagination: Pagination): Promise<Page<AccountBalance>> {
        return this.get<Page<AccountBalance>>("/accounts", {term, withDebt, page: pagination.page, size: pagination.size});
    }

    /** Solo los totales de la cuenta; las listas se piden aparte, página a página. */
    statement(studentId: number | string): Promise<AccountStatement> {
        return this.get<AccountStatement>(`/accounts/${studentId}`);
    }

    /** Cargos y pagos del estudiante, del más reciente al más antiguo, con el saldo acumulado. */
    movements(studentId: number | string, pagination: Pagination): Promise<Page<AccountMovement>> {
        return this.get<Page<AccountMovement>>(`/accounts/${studentId}/movements`, {page: pagination.page, size: pagination.size});
    }

    /** Excel con los movimientos del rango (máximo 3 meses), con su saldo acumulado. */
    exportMovements(studentId: number | string, range: {from: string; to: string}): Promise<Blob> {
        return this.get<Blob>(`/accounts/${studentId}/movements/export`, range);
    }

    summary(): Promise<BillingSummary> {
        return this.get<BillingSummary>("/summary");
    }

    /** Ajustes de facturación que necesitan todas las pantallas de Finanzas. */
    settings(): Promise<BillingSettings> {
        return this.get<BillingSettings>("/settings");
    }
}
