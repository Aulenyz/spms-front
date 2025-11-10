import {Navigate, Route, Routes} from "react-router-dom";
import {ListEnrollmentPage} from "./ListEnrollmentPage.tsx";

export const EnrollmentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListEnrollmentPage/>}/>
            <Route path="/" element={<Navigate to="/enrollments" replace/>}/>
        </Routes>
    )
}