import {Navigate, Route, Routes} from "react-router-dom";
import {ListPaymentPage} from "./ListPaymentPage.tsx";

export const PaymentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListPaymentPage/>}/>
            <Route path="/" element={<Navigate to="/payments" replace/>}/>
        </Routes>
    )
}