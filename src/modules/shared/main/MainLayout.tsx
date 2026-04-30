import {useMemo, useState} from "react";
import {Navigate, Outlet, useLocation} from "react-router-dom";
import {MainSidebar} from "./MainSidebar.tsx";
import {MainNavbar} from "./MainNavbar.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LoadingPage} from "../../../components/io/output/LoadingPage.tsx";

const resolvePageMeta = (pathname: string) => {
    if (pathname.startsWith("/payments")) {
        return {title: "Pagos", subtitle: "Cobros y transacciones"};
    }

    if (pathname.startsWith("/students")) {
        return {title: "Estudiantes", subtitle: "Registro academico"};
    }

    if (pathname.startsWith("/enrollments")) {
        return {title: "Inscripciones", subtitle: "Flujo academico"};
    }

    if (pathname.startsWith("/users")) {
        return {title: "Usuarios", subtitle: "Accesos y permisos"};
    }

    if (pathname.startsWith("/specializations")) {
        return {title: "Unidades", subtitle: "Estructura academica"};
    }

    if (pathname.startsWith("/courses/templates")) {
        return {title: "Plantillas", subtitle: "Configuracion base"};
    }

    return {title: "Panel", subtitle: "Resumen operativo"};
};

export const MainLayout = () => {
    const {validating, authenticated}: AuthContextValue = useAuthContext();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const pageMeta = useMemo(() => resolvePageMeta(location.pathname), [location.pathname]);

    if (validating) {
        return <LoadingPage/>;
    }

    if (!authenticated) {
        return <Navigate to="/auth/login" replace/>;
    }

    return (
        <div className="app-shell">
            <MainSidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
                onToggleCollapse={() => setCollapsed((current) => !current)}
            />

            <div className={`app-shell-main ${collapsed ? "lg:pl-[104px]" : "lg:pl-[302px]"}`}>
                <MainNavbar
                    title={pageMeta.title}
                    subtitle={pageMeta.subtitle}
                    onOpenSidebar={() => setMobileOpen(true)}
                />

                <main id="content" role="main" className="app-shell-content">
                    <div className="app-shell-content-inner">
                        <Outlet/>
                    </div>
                </main>
            </div>
        </div>
    );
};
