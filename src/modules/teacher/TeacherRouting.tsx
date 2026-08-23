import {Navigate, Route, Routes} from "react-router-dom";
import {TeacherWorkloadPage} from "./TeacherWorkloadPage.tsx";

export const TeacherRouting = () => <Routes>
    <Route path="schedule" element={<TeacherWorkloadPage/>}/>
    <Route path="*" element={<Navigate to="/teacher/schedule" replace/>}/>
</Routes>;
