import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const TeacherWorkloadPage = lazyPage(() => import("./TeacherWorkloadPage.tsx"), "TeacherWorkloadPage");

export const TeacherRouting = () => <Routes>
    <Route path="schedule" element={<TeacherWorkloadPage/>}/>
    <Route path="*" element={<Navigate to="/teacher/schedule" replace/>}/>
</Routes>;
