import {useMemo, useState} from "react";
import {Navigate, Outlet, useLocation, useNavigate} from "react-router-dom";
import {MainSidebar} from "./MainSidebar.tsx";
import {MainNavbar} from "./MainNavbar.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LoadingPage} from "../../../components/io/output/LoadingPage.tsx";
import {resolveRouteAuthority} from "../../../app/security/routeAuthorities.ts";
import {resolveFirstAuthorizedPath} from "../../../app/navigation/menu.ts";

const resolvePageMeta = (pathname: string) => {
    if (/^\/courses\/templates\/\d+/.test(pathname)) {
        return {title: "Detalles", subtitle: "Plantillas de cursos"};
    }

    if (pathname.startsWith("/payments")) {
        return {title: "Pagos", subtitle: "Cobros y transacciones"};
    }

    if (pathname.startsWith("/students")) {
        return {title: "Estudiantes", subtitle: "Registro academico"};
    }

    if (pathname.startsWith("/subjects")) {
        return {title: "Materias", subtitle: "Gestion academica"};
    }

    if (pathname.startsWith("/help")) {
        return {title: "Ayuda", subtitle: "Soporte y preguntas frecuentes"};
    }

    if (pathname.startsWith("/catalog")) {
        if (pathname.startsWith("/catalog/categories")) return {title: "Categorías", subtitle: "Recursos educativos"};
        if (pathname.startsWith("/catalog/collections")) return {title: "Kits y colecciones", subtitle: "Recursos educativos"};
        return {title: "Productos", subtitle: "Recursos educativos"};
    }

    if (pathname.startsWith("/courses")) {
        return /^\/courses\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Cursos"}
            : {title: "Cursos", subtitle: "Gestion academica"};
    }

    if (pathname.startsWith("/enrollments")) {
        return {title: "Inscripciones", subtitle: "Flujo academico"};
    }

    if (pathname.startsWith("/users")) {
        return /^\/users\/roles\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Gestion de usuarios"}
            : /^\/users\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Gestion de usuarios"}
            : {title: "Usuarios", subtitle: "Gestion de usuarios"};
    }

    if (pathname.startsWith("/specializations")) {
        return /^\/specializations\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Areas especializadas"}
            : {title: "Areas especializadas", subtitle: "Estructura academica"};
    }

    if (pathname.startsWith("/guardians")) {
        return /^\/guardians\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Padres / Tutores"}
            : {title: "Padres / Tutores", subtitle: "Administracion"};
    }

    if (pathname.startsWith("/courses/templates")) {
        return {title: "Plantillas", subtitle: "Configuracion base"};
    }

    return {title: "Panel", subtitle: "Resumen operativo"};
};

const buildBreadcrumbs = (pathname: string): Array<{label: string; to?: string}> => {
    // Breadcrumbs are hierarchical for navigation (no "volver" wording).
    if (/^\/courses\/templates\/\d+/.test(pathname)) {
        return [
            {label: "Plantillas", to: "/courses/templates"},
            {label: "Cursos", to: "/courses/templates"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (/^\/courses\/\d+/.test(pathname)) {
        return [
            {label: "Cursos", to: "/courses/list"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (/^\/specializations\/\d+/.test(pathname)) {
        return [
            {label: "Areas especializadas", to: "/specializations/list"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (/^\/users\/\d+/.test(pathname)) {
        return [
            {label: "Gestion de usuarios", to: "/users"},
            {label: "Usuarios", to: "/users"},
            {label: "Detalles", to: pathname},
        ];
    }
    if (/^\/users\/roles\/\d+/.test(pathname)) {
        return [
            {label: "Gestion de usuarios", to: "/users"},
            {label: "Roles", to: "/users/roles"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (/^\/guardians\/\d+/.test(pathname)) {
        return [
            {label: "Padres / Tutores", to: "/guardians/list"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (pathname.startsWith("/courses/templates")) {
        if (pathname === "/courses/templates") return [{label: "Plantillas", to: "/courses/templates"}, {label: "Cursos", to: "/courses/templates"}];
        if (pathname.startsWith("/courses/templates/prices")) return [{label: "Plantillas", to: "/courses/templates"}, {label: "Precios", to: pathname}];
        if (pathname.startsWith("/courses/templates/materials")) return [{label: "Plantillas", to: "/courses/templates"}, {label: "Materiales", to: pathname}];
        return [{label: "Plantillas", to: "/courses/templates"}, {label: "Cursos", to: pathname}];
    }

    if (pathname.startsWith("/courses")) {
        if (pathname === "/courses/list") return [{label: "Cursos", to: "/courses/list"}];
        return [{label: "Cursos", to: "/courses/list"}, {label: "Detalles", to: pathname}];
    }

    if (pathname.startsWith("/subjects")) return [{label: "Materias", to: pathname}];
    if (pathname.startsWith("/help")) return [{label: "Ayuda", to: "/help"}];
    if (pathname.startsWith("/catalog")) {
        const section = {label: "Recursos educativos", to: "/catalog/products"};
        if (pathname.startsWith("/catalog/categories")) return [section, {label: "Categorías", to: pathname}];
        if (pathname.startsWith("/catalog/collections")) return [section, {label: "Kits y colecciones", to: pathname}];
        return [section, {label: "Productos", to: pathname}];
    }

    if (pathname.startsWith("/payments")) return [{label: "Pagos", to: pathname}];
    if (pathname.startsWith("/enrollments")) return [{label: "Inscripciones", to: pathname}];
    if (pathname.startsWith("/students")) return [{label: "Estudiantes", to: pathname}];
    if (pathname.startsWith("/guardians")) {
        if (pathname === "/guardians/list") return [{label: "Padres / Tutores", to: "/guardians/list"}];
        return [{label: "Padres / Tutores", to: "/guardians/list"}, {label: "Detalles", to: pathname}];
    }
    if (pathname.startsWith("/users")) {
        if (pathname === "/users") return [{label: "Gestion de usuarios", to: "/users"}, {label: "Usuarios", to: "/users"}];
        if (pathname.startsWith("/users/roles")) return [{label: "Gestion de usuarios", to: "/users"}, {label: "Roles", to: pathname}];
        if (pathname.startsWith("/users/authorities")) return [{label: "Gestion de usuarios", to: "/users"}, {label: "Permisos", to: pathname}];
        if (pathname.startsWith("/users/invitations")) return [{label: "Gestion de usuarios", to: "/users"}, {label: "Invitaciones", to: pathname}];
        return [{label: "Gestion de usuarios", to: "/users"}, {label: "Usuarios", to: pathname}];
    }
    if (pathname.startsWith("/specializations")) return [{label: "Areas especializadas", to: pathname}];
    if (pathname.startsWith("/home")) return [{label: "Inicio", to: pathname}];

    return [];
};

export const MainLayout = () => {
    const {validating, authenticated, hasAuthority}: AuthContextValue = useAuthContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const pageMeta = useMemo(() => resolvePageMeta(location.pathname), [location.pathname]);
    const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);

    if (validating) {
        return <LoadingPage/>;
    }

    if (!authenticated) {
        return <Navigate to="/auth/login" replace/>;
    }

    const firstAuthorizedPath = resolveFirstAuthorizedPath(hasAuthority);
    if (location.pathname === "/") {
        return <Navigate to={firstAuthorizedPath ?? "/errors/403"} replace/>;
    }

    const requiredAuthority = resolveRouteAuthority(location.pathname);
    if (requiredAuthority && !hasAuthority(requiredAuthority)) {
        if (location.pathname === "/home" && firstAuthorizedPath && firstAuthorizedPath !== "/home") {
            return <Navigate to={firstAuthorizedPath} replace/>;
        }
        return <Navigate to="/errors/403" replace/>;
    }

    return (
        <div className="app-shell">
            <MainSidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
                onToggleCollapse={() => setCollapsed((current) => !current)}
            />

            <div className={`app-shell-main ${collapsed ? "lg:pl-[104px]" : "lg:pl-[324px]"}`}>
                <MainNavbar
                    subtitle={pageMeta.subtitle}
                    onOpenSidebar={() => setMobileOpen(true)}
                    breadcrumbs={breadcrumbs.map((crumb) => ({
                        label: crumb.label,
                        onClick: crumb.to ? () => navigate(crumb.to as string) : undefined,
                    }))}
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
