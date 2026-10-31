import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListSubjectPage = lazyPage(() => import("./ListSubjectPage.tsx"), "ListSubjectPage");

export const SubjectRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListSubjectPage/>}/>
            <Route path="*" element={<Navigate to="/subjects/list" replace/>}/>
        </Routes>
    );
};

