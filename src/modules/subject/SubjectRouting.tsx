import {Navigate, Route, Routes} from "react-router-dom";
import {ListSubjectPage} from "./ListSubjectPage.tsx";

export const SubjectRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListSubjectPage/>}/>
            <Route path="*" element={<Navigate to="/subjects/list" replace/>}/>
        </Routes>
    );
};

