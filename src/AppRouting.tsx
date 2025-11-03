import {Navigate, Route, Routes} from "react-router-dom";
import {AuthPage} from "./modules/auth/AuthPage";
import {HomeRouting} from "./modules/home/HomeRouting";
import {Error500} from "./modules/errors/components/Error500.tsx";
import {ErrorsLayout} from "./modules/errors/ErrorsLayout.tsx";
import {Error404} from "./modules/errors/components/Error404.tsx";
import {Error403} from "./modules/errors/components/Error403.tsx";
import {MainLayout} from "./modules/shared/main/MainLayout.tsx";

export const AppRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route path="/*" element={<HomeRouting/>}/>
            </Route>

            <Route path="/auth/*" element={<AuthPage/>}/>

            <Route path="/errors" element={<ErrorsLayout/>}>
                <Route index element={<Error404/>}/>
                <Route path="403" element={<Error403/>}/>
                <Route path="404" element={<Error404/>}/>
                <Route path="500" element={<Error500/>}/>
            </Route>

            <Route path="*" element={<Navigate to="/errors/404" replace/>}/>
        </Routes>
    );
}