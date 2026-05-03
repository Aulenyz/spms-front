import {Navigate, Route, Routes} from "react-router-dom";
import {ListSpecializationPage} from "./ListSpecializationPage.tsx";
import {SpecializationDetailsPage} from "./SpecializationDetailsPage.tsx";

export const SpecializationRouting = () => {
    return (
        <Routes>
            <Route path='list' element={<ListSpecializationPage/>}/>
            <Route path=':id' element={<SpecializationDetailsPage/>}/>
            <Route path="/" element={<Navigate to="/specializations/list" replace/>}/>
        </Routes>
    )
}
