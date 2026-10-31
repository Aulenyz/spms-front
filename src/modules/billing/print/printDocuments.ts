import {
    formatDate,
    InvoiceDetails,
    InvoiceStatusLabel,
    money,
    PaymentMethodLabel,
    ReceiptDetails,
    ReceiptStatus,
} from "../../../domain/billing/Invoice.ts";

type OrganizationRef = ReceiptDetails["organization"];

const escape = (value: unknown) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: "Plus Jakarta Sans", Arial, sans-serif; color: #0f172a; margin: 32px; font-size: 13px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
  .org { display: flex; gap: 12px; align-items: center; }
  .org img { width: 56px; height: 56px; object-fit: contain; }
  .org h1 { font-size: 18px; margin: 0; }
  .muted { color: #64748b; }
  .doc { text-align: right; }
  .doc .kind { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #64748b; }
  .doc .number { font-size: 20px; font-weight: 800; }
  dl { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin: 20px 0; }
  dt { font-size: 11px; color: #64748b; }
  dd { margin: 2px 0 0; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 8px 6px; }
  td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; }
  .right { text-align: right; }
  tfoot td { border: none; font-weight: 700; }
  .total { font-size: 16px; }
  .void { color: #e11d48; border: 3px solid #e11d48; display: inline-block; padding: 4px 12px; font-weight: 800; letter-spacing: .2em; transform: rotate(-6deg); margin-top: 12px; }
  footer { margin-top: 28px; font-size: 11px; color: #64748b; }
  @page { margin: 12mm; }
`;

const header = (organization: OrganizationRef, kind: string, number: string, date: string) => `
  <header>
    <div class="org">
      ${organization.logo ? `<img src="${escape(organization.logo)}" alt="">` : ""}
      <div><h1>${escape(organization.name)}</h1>${organization.document ? `<div class="muted">RNC ${escape(organization.document)}</div>` : ""}</div>
    </div>
    <div class="doc"><div class="kind">${kind}</div><div class="number">${escape(number)}</div><div class="muted">${escape(date)}</div></div>
  </header>`;

const page = (title: string, body: string) =>
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escape(title)}</title><style>${STYLES}</style></head><body>${body}</body></html>`;

/** Recibo de pago imprimible. */
export const receiptHtml = (details: ReceiptDetails) => {
    const {receipt, organization, payments} = details;
    const rows = payments.map((payment) => `
      <tr><td>${escape(payment.invoiceNumber)}</td><td>${escape(payment.description ?? "")}</td><td class="right">${money.format(payment.amount)}</td></tr>`).join("");
    return page(`Recibo ${receipt.number}`, `
      ${header(organization, "Recibo de pago", receipt.number, formatDate(receipt.date))}
      <dl>
        <div><dt>Estudiante</dt><dd>${escape(receipt.student.name)}${receipt.student.document ? ` · ${escape(receipt.student.document)}` : ""}</dd></div>
        <div><dt>Pagado por</dt><dd>${escape(receipt.guardian?.name ?? "—")}</dd></div>
        <div><dt>Forma de pago</dt><dd>${PaymentMethodLabel[receipt.method]}${receipt.reference ? ` · Ref. ${escape(receipt.reference)}` : ""}</dd></div>
        <div><dt>Recibido por</dt><dd>${escape(details.receivedBy ?? "—")}</dd></div>
      </dl>
      <table>
        <thead><tr><th>Factura</th><th>Concepto</th><th class="right">Abonado</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2" class="right">Total recibido</td><td class="right total">${money.format(receipt.amount)}</td></tr></tfoot>
      </table>
      ${details.notes ? `<footer>Nota: ${escape(details.notes)}</footer>` : ""}
      ${receipt.status !== ReceiptStatus.PAID ? `<div class="void">ANULADO</div><footer>${escape(details.voidReason ?? "")}</footer>` : ""}`);
};

/** Factura imprimible con sus conceptos, impuestos y pagos. */
export const invoiceHtml = (details: InvoiceDetails, organization: OrganizationRef) => {
    const {invoice, items, payments} = details;
    const rows = items.map((item) => `
      <tr><td>${escape(item.description)}</td><td class="right">${Number(item.quantity)}</td><td class="right">${money.format(item.unitPrice)}</td>
      <td class="right">${money.format(item.taxAmount)}</td><td class="right">${money.format(item.amount)}</td></tr>`).join("");
    const paid = payments.filter((payment) => payment.status === ReceiptStatus.PAID)
        .map((payment) => `${escape(payment.receiptNumber ?? "")} (${formatDate(payment.date)}) ${money.format(payment.amount)}`).join(" · ");
    return page(`Factura ${invoice.number}`, `
      ${header(organization, "Factura", invoice.number, formatDate(invoice.emittedAt))}
      <dl>
        <div><dt>Estudiante</dt><dd>${escape(invoice.student?.name ?? "—")}${invoice.student?.document ? ` · ${escape(invoice.student.document)}` : ""}</dd></div>
        <div><dt>Facturada a</dt><dd>${escape(invoice.guardian?.name ?? "—")}</dd></div>
        <div><dt>Vence</dt><dd>${formatDate(invoice.dueDate)}</dd></div>
        <div><dt>Comprobante fiscal</dt><dd>${escape(invoice.ncf ?? "Sin NCF")}</dd></div>
        <div><dt>Estado</dt><dd>${InvoiceStatusLabel[invoice.status]}</dd></div>
      </dl>
      <table>
        <thead><tr><th>Concepto</th><th class="right">Cant.</th><th class="right">Precio</th><th class="right">Impuesto</th><th class="right">Importe</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="4" class="right">Subtotal</td><td class="right">${money.format(invoice.subtotal)}</td></tr>
          <tr><td colspan="4" class="right">Impuestos</td><td class="right">${money.format(invoice.taxAmount)}</td></tr>
          <tr><td colspan="4" class="right">Total</td><td class="right total">${money.format(invoice.total)}</td></tr>
          <tr><td colspan="4" class="right">Pagado</td><td class="right">${money.format(invoice.paid)}</td></tr>
          <tr><td colspan="4" class="right">Saldo</td><td class="right">${money.format(invoice.due)}</td></tr>
        </tfoot>
      </table>
      ${paid ? `<footer>Pagos: ${paid}</footer>` : ""}
      ${details.voidReason ? `<div class="void">ANULADA</div><footer>${escape(details.voidReason)}</footer>` : ""}`);
};

/** Imprime un documento HTML sin salir de la pantalla (iframe oculto). */
export const printHtml = (html: string) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    Object.assign(frame.style, {position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0"});
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc || !frame.contentWindow) return;
    doc.open();
    doc.write(html);
    doc.close();
    const print = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 1000);
    };
    // Espera a que cargue el logo, si lo hay
    const images = Array.from(doc.images);
    if (images.length === 0) setTimeout(print, 50);
    else Promise.all(images.map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
        image.onload = image.onerror = resolve;
    }))).then(print);
};
