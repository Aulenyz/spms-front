import {MainSidebar} from "./MainSidebar.tsx";
import {MainNavbar} from "./MainNavbar.tsx";
import {Navigate, Outlet} from "react-router-dom";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LoadingPage} from "../../../components/io/output/LoadingPage.tsx";

export const MainLayout = () => {
    const {validating, authenticated}: AuthContextValue = useAuthContext();

    if (validating) {
        return <LoadingPage/>
    } else if (authenticated) {
        return (

            <div className="flex grow">
                <MainSidebar/>
                <MainNavbar/>
                <main className="grow content pt-5" id="content" role="content">
                    <div className="wrapper flex grow flex-col">
                        <Outlet/>
                    </div>
                </main>
            </div>
        )
    } else {
        return <Navigate to={'/auth/login'} replace={true}/>;
    }

}