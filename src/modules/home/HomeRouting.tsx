import {Navigate, Route, Routes} from "react-router-dom";
import {HomePage} from "./HomePage.tsx";

export const HomeRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace/>}/>
            <Route path='home' element={<HomePage/>}/>
        </Routes>
    )
}