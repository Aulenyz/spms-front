import {Navigate, Route, Routes} from "react-router-dom";
import {lazyPage} from "../../app/routing/lazyPage.ts";

const ListSpecializationPage = lazyPage(() => import("./ListSpecializationPage.tsx"), "ListSpecializationPage");
const SpecializationDetailsPage = lazyPage(() => import("./SpecializationDetailsPage.tsx"), "SpecializationDetailsPage");

export const SpecializationRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListSpecializationPage/>}/>
            <Route path=':id' element={<SpecializationDetailsPage/>}/>
            <Route path="/" element={<Navigate to="/specializations/list" replace/>}/>
        </Routes>
    )
}
