import {BaseService} from "../BaseService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {
    AccountBalance,
    AccountStatement,
    BillingSummary,
    Invoice,
    InvoiceDetails,
    InvoiceFormValues,
    InvoiceStatus,
    PaymentFormValues,
    PaymentMethod,
    Receipt,
    ReceiptDetails,
    ReceiptStatus,
} from "../../domain/billing/Invoice.ts";

export type InvoiceFilters = {term?: string; status?: InvoiceStatus; studentId?: number; open?: boolean; from?: string; to?: string};
export type ReceiptFilters = {term?: string; status?: ReceiptStatus; method?: PaymentMethod; studentId?: number; from?: string; to?: string};

const params = (filters: object, pagination: Pagination) => {
    const clean = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ""));
    return {page: pagination.page, size: pagination.size, ...clean};
};

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

    /** Facturas con saldo de un estudiante, para registrar un pago. */
    open(studentId: number): Promise<Page<Invoice>> {
        return this.search({studentId, open: true}, {...Pagination.first, size: 50});
    }

    details(id: number | string): Promise<InvoiceDetails> {
        return this.get<InvoiceDetails>(`/${id}`);
    }

    createInvoice(values: InvoiceFormValues): Promise<InvoiceDetails> {
        return this.post<InvoiceDetails>("", values);
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

    details(id: number | string): Promise<ReceiptDetails> {
        return this.get<ReceiptDetails>(`/${id}`);
    }

    register(values: PaymentFormValues): Promise<ReceiptDetails> {
        return this.post<ReceiptDetails>("", values);
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

    statement(studentId: number | string): Promise<AccountStatement> {
        return this.get<AccountStatement>(`/accounts/${studentId}`);
    }

    summary(): Promise<BillingSummary> {
        return this.get<BillingSummary>("/summary");
    }

    runRecurring(): Promise<{invoices: number; overdue: number}> {
        return this.post<{invoices: number; overdue: number}>("/recurring/run");
    }
}
