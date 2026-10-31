import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";
import {LoginPage} from "./LoginPage.tsx";

const RecoverPage = lazyPage(() => import("./recover/RecoverPage.tsx"), "RecoverPage");
const SendRecoverPasswordPage = lazyPage(() => import("./recover/SendRecoverPasswordPage.tsx"), "SendRecoverPasswordPage");
const SelectOrganizationPage = lazyPage(() => import("./select-company/SelectOrganizationPage.tsx"), "SelectOrganizationPage");
const RegisterInvitationPage = lazyPage(() => import("./RegisterInvitationPage.tsx"), "RegisterInvitationPage");

export const AuthPage = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/auth/login" replace/>}/>
            <Route path='login' element={<LoginPage/>}/>
            <Route path='reset' element={<RecoverPage/>}/>
            <Route path='recover' element={<RecoverPage/>}/>
            <Route path='send-recover' element={<SendRecoverPasswordPage/>}/>
            <Route path="select-organization" element={<SelectOrganizationPage />} />
            <Route path="register" element={<RegisterInvitationPage />} />
        </Routes>
    )
}
