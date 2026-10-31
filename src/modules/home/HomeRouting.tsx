import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const HomePage = lazyPage(() => import("./HomePage.tsx"), "HomePage");

export const HomeRouting = () => {
    return (
        <Routes>
            <Route index element={<HomePage/>}/>
            <Route path="*" element={<Navigate to="/errors/404" replace/>}/>
        </Routes>
    );
};
