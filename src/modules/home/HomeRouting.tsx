import {Navigate, Route, Routes} from "react-router-dom";
import {HomePage} from "./HomePage.tsx";

export const HomeRouting = () => {
    return (
        <Routes>
            <Route index element={<HomePage/>}/>
            <Route path="*" element={<Navigate to="/errors/404" replace/>}/>
        </Routes>
    );
};
