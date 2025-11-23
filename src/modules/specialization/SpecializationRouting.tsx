import {Navigate, Route, Routes} from "react-router-dom";
import {ListSpecializationPage} from "./ListSpecializationPage.tsx";

export const SpecializationRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListSpecializationPage/>}/>
            <Route path="/" element={<Navigate to="/specializations/list" replace/>}/>
        </Routes>
    )
}