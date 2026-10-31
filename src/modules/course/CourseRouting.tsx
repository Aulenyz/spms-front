import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListCoursePage = lazyPage(() => import("./ListCoursePage.tsx"), "ListCoursePage");
const CourseDetailsPage = lazyPage(() => import("./CourseDetailsPage.tsx"), "CourseDetailsPage");

export const CourseRouting = () => {
    return (
        <Routes>
            <Route path="list" element={<ListCoursePage/>}/>
            <Route path=":id" element={<CourseDetailsPage/>}/>
            <Route path="*" element={<Navigate to="/courses/list" replace/>}/>
        </Routes>
    );
};

