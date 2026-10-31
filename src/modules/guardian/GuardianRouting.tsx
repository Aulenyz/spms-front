import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListGuardianPage = lazyPage(() => import("./ListGuardianPage.tsx"), "ListGuardianPage");
const GuardianDetailsPage = lazyPage(() => import("./GuardianDetailsPage.tsx"), "GuardianDetailsPage");

export const GuardianRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListGuardianPage/>}/>
            <Route path=":id" element={<GuardianDetailsPage/>}/>
            <Route path="*" element={<Navigate to="/guardians/list" replace/>}/>
        </Routes>
    );
};

