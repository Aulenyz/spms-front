import {Navigate, Route, Routes} from "react-router-dom";
import {HomePage} from "./HomePage.tsx";
import {UserListPage} from "../user/UserListPage.tsx";

export const HomeRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace/>}/>
            <Route path='home' element={<HomePage/>}/>
            <Route path='users' element={<UserListPage/>}/>
        </Routes>
    )
}