import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListInvoicePage = lazyPage(() => import("./invoice/ListInvoicePage.tsx"), "ListInvoicePage");
const InvoiceDetailsPage = lazyPage(() => import("./invoice/InvoiceDetailsPage.tsx"), "InvoiceDetailsPage");
const ListReceiptPage = lazyPage(() => import("./payment/ListReceiptPage.tsx"), "ListReceiptPage");
const ReceiptDetailsPage = lazyPage(() => import("./payment/ReceiptDetailsPage.tsx"), "ReceiptDetailsPage");
const ListAccountPage = lazyPage(() => import("./account/ListAccountPage.tsx"), "ListAccountPage");
const AccountStatementPage = lazyPage(() => import("./account/AccountStatementPage.tsx"), "AccountStatementPage");

export const InvoiceRouting = () => (
    <Routes>
        <Route path="list" element={<ListInvoicePage/>}/>
        <Route path=":id" element={<InvoiceDetailsPage/>}/>
        <Route path="*" element={<Navigate to="/invoices/list" replace/>}/>
    </Routes>
);

export const ReceiptRouting = () => (
    <Routes>
        <Route path="list" element={<ListReceiptPage/>}/>
        <Route path=":id" element={<ReceiptDetailsPage/>}/>
        <Route path="*" element={<Navigate to="/payments/list" replace/>}/>
    </Routes>
);

export const AccountRouting = () => (
    <Routes>
        <Route path="list" element={<ListAccountPage/>}/>
        <Route path=":studentId" element={<AccountStatementPage/>}/>
        <Route path="*" element={<Navigate to="/accounts/list" replace/>}/>
    </Routes>
);
