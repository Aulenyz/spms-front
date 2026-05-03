import {Navigate, Route, Routes} from "react-router-dom";
import {ListCoursePage} from "./ListCoursePage.tsx";
import {CourseDetailsPage} from "./CourseDetailsPage.tsx";

export const CourseRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListCoursePage/>}/>
            <Route path=":id" element={<CourseDetailsPage/>}/>
            <Route path="*" element={<Navigate to="/courses/list" replace/>}/>
        </Routes>
    );
};

