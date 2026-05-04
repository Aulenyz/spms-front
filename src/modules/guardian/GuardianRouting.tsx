import {Navigate, Route, Routes} from "react-router-dom";
import {ListGuardianPage} from "./ListGuardianPage.tsx";
import {GuardianDetailsPage} from "./GuardianDetailsPage.tsx";

export const GuardianRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListGuardianPage/>}/>
            <Route path=":id" element={<GuardianDetailsPage/>}/>
            <Route path="*" element={<Navigate to="/guardians/list" replace/>}/>
        </Routes>
    );
};

