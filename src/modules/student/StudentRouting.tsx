import { Navigate, Route, Routes } from "react-router-dom";
import { ListStudentPage } from "./ListStudentPage";

export const StudentRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListStudentPage />} />

            <Route index element={<Navigate to="list" replace />} />
        </Routes>
    );
};