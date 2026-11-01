import {
    BillingTone,
    InvoiceStatus,
    InvoiceStatusLabel,
    InvoiceStatusTone,
    PaymentMethod,
    PaymentMethodIcon,
    PaymentMethodLabel,
    ReceiptStatus,
} from "../../../domain/billing/Invoice.ts";

// Nombres completos para que Tailwind conserve cada clase (no detecta las armadas con plantillas).
const TONE_CLASS: Record<BillingTone, string> = {
    success: "billing-pill-success",
    warning: "billing-pill-warning",
    partial: "billing-pill-partial",
    danger: "billing-pill-danger",
    info: "billing-pill-info",
    muted: "billing-pill-muted",
};

export const InvoiceStatusPill = ({status}: {status: InvoiceStatus}) => (
    <span className={`billing-pill ${TONE_CLASS[InvoiceStatusTone[status]]}`}>{InvoiceStatusLabel[status]}</span>
);

export const ReceiptStatusPill = ({status}: {status: ReceiptStatus}) => (
    <span className={`billing-pill billing-pill-${status === ReceiptStatus.PAID ? "success" : "muted"}`}>
        {status === ReceiptStatus.PAID ? "Cobrado" : "Anulado"}
    </span>
);

export const PaymentMethodTag = ({method}: {method: PaymentMethod}) => (
    <span className="inline-flex items-center gap-1.5 text-sm" style={{color: "var(--text-secondary)"}}>
        <i className={`fa ${PaymentMethodIcon[method]} text-xs`} style={{color: "var(--text-tertiary)"}}/>
        {PaymentMethodLabel[method]}
    </span>
);
