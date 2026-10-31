import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListStudentPage = lazyPage(() => import("./ListStudentPage.tsx"), "ListStudentPage");
const BulkUploadStudentPage = lazyPage(() => import("./bulk-upload/BulkUploadStudentPage.tsx"), "BulkUploadStudentPage");

export const StudentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListStudentPage/>}/>
            <Route path='bulk-upload' element={<BulkUploadStudentPage/>}/>
            <Route path="*" element={<Navigate to="/students/list" replace/>}/>
        </Routes>
    )
}