import {Navigate, Route, Routes} from "react-router-dom";
import {ListStudentPage} from "./ListStudentPage.tsx";
import { BulkUploadStudentPage } from "./bulk-upload/BulkUploadStudentPage.tsx";

export const StudentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListStudentPage/>}/>
            <Route path='bulk-upload' element={<BulkUploadStudentPage/>}/>
            <Route path="/" element={<Navigate to="/students" replace/>}/>
        </Routes>
    )
}