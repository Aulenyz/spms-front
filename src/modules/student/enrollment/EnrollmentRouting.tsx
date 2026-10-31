import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../../app/routing/lazyPage.ts";

const ListEnrollmentPage = lazyPage(() => import("./ListEnrollmentPage.tsx"), "ListEnrollmentPage");

export const EnrollmentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListEnrollmentPage/>}/>
            <Route path="*" element={<Navigate to="/enrollments/list" replace/>}/>
        </Routes>
    )
}