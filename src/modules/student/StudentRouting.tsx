import {Navigate, Route, Routes} from "react-router-dom";
import {ListStudentPage} from "./ListStudentPage.tsx";

export const StudentRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListStudentPage/>}/>
            <Route path="/" element={<Navigate to="/students" replace/>}/>
        </Routes>
    )
}