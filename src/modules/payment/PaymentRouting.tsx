import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListPaymentPage = lazyPage(() => import("./ListPaymentPage.tsx"), "ListPaymentPage");

export const PaymentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListPaymentPage/>}/>
            <Route path="*" element={<Navigate to="/payments/list" replace/>}/>
        </Routes>
    )
}