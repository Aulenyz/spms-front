import {useState} from "react";
import {MainSidebar} from "./MainSidebar.tsx";
import {MainNavbar} from "./MainNavbar.tsx";
import {Navigate, Outlet} from "react-router-dom";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LoadingPage} from "../../../components/io/output/LoadingPage.tsx";

export const MainLayout = () => {
    const {validating, authenticated}: AuthContextValue = useAuthContext();
    const [collapsed] = useState(false);

    if (validating) {
        return <LoadingPage/>;
    }

    if (!authenticated) {
        return <Navigate to="/auth/login" replace/>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Sidebar */}
            <MainSidebar/>

            {/* Contenedor principal */}
            <div
                className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
                    collapsed ? "ml-[85px]" : "ml-[250px]"
                }`}
            >
                <MainNavbar/>

                {/* Contenido */}
                <main
                    id="content"
                    role="content"
                    className="flex-1 overflow-y-auto bg-white px-6 py-4 md:px-8 md:py-5 rounded-tl-2xl shadow-inner"
                >
                    <div className="max-w-[95%] mx-auto">
                        <Outlet/>
                    </div>
                </main>
            </div>
        </div>
    );
};
