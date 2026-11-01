import {Suspense, useMemo, useState} from "react";
import {Navigate, Outlet, useLocation, useNavigate} from "react-router-dom";
import {MainSidebar} from "./MainSidebar.tsx";
import {MainNavbar} from "./MainNavbar.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LoadingPage} from "../../../components/io/output/LoadingPage.tsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {RouteErrorBoundary} from "../../../app/routing/RouteErrorBoundary.tsx";
import {resolveRouteAuthority} from "../../../app/security/routeAuthorities.ts";
import {resolveFirstAuthorizedPath, resolveRouteTone} from "../../../app/navigation/menu.ts";
import {AssistantChat} from "../../assistant/AssistantChat.tsx";

const resolvePageMeta = (pathname: string) => {
    if (/^\/courses\/templates\/\d+/.test(pathname)) {
        return {title: "Detalles", subtitle: "Cursos base"};
    }

    if (pathname.startsWith("/payments")) {
        return {title: "Pagos recibidos", subtitle: "Finanzas"};
    }

    if (pathname.startsWith("/invoices")) {
        return {title: "Facturas emitidas", subtitle: "Finanzas"};
    }

    if (pathname.startsWith("/accounts")) {
        return /^\/accounts\/\d+/.test(pathname) ? {title: "Estado de cuenta", subtitle: "Estados de cuenta"} : {title: "Estados de cuenta", subtitle: "Finanzas"};
    }

    if (pathname.startsWith("/students")) {
        return {title: "Estudiantes", subtitle: "Registro académico"};
    }

    if (pathname.startsWith("/subjects")) {
        return {title: "Materias", subtitle: "Gestión académica"};
    }

    if (pathname.startsWith("/help")) {
        return {title: "Ayuda", subtitle: "Soporte y preguntas frecuentes"};
    }

    if (pathname.startsWith("/catalog")) {
        if (/^\/catalog\/products\/\d+/.test(pathname)) return {title: "Detalles", subtitle: "Conceptos de pago"};
        if (pathname.startsWith("/catalog/categories")) return {title: "Categorías de pago", subtitle: "Finanzas"};
        if (pathname.startsWith("/catalog/taxes")) return {title: "Impuestos", subtitle: "Finanzas"};
        return {title: "Conceptos de pago", subtitle: "Finanzas"};
    }

    if (pathname.startsWith("/courses/templates")) {
        return {title: "Cursos base", subtitle: "Configuración académica"};
    }

    if (pathname.startsWith("/courses")) {
        return /^\/courses\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Cursos"}
            : {title: "Cursos", subtitle: "Gestión académica"};
    }

    if (pathname.startsWith("/enrollments")) {
        return {title: "Inscripciones", subtitle: "Flujo académico"};
    }

    if (pathname.startsWith("/users")) {
        return /^\/users\/roles\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Gestión de usuarios"}
            : /^\/users\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Gestión de usuarios"}
            : {title: "Usuarios", subtitle: "Gestión de usuarios"};
    }

    if (pathname.startsWith("/specializations")) {
        return /^\/specializations\/\d+/.test(pathname)
            ? {title: "Detalles", subtitle: "Áreas especializadas"}
            : {title: "Áreas especializadas", subtitle: "Estructura académica"};
    }

    if (pathname.startsWith("/guardians")) {
        return {title: "Representantes", subtitle: "Administración"};
    }

    return {title: "Panel", subtitle: "Resumen operativo"};
};

const buildBreadcrumbs = (pathname: string): Array<{label: string; to?: string}> => {
    // Breadcrumbs are hierarchical for navigation (no "volver" wording).
    if (/^\/courses\/templates\/\d+/.test(pathname)) {
        return [
            {label: "Cursos base", to: "/courses/templates"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (/^\/courses\/\d+/.test(pathname)) {
        return [
            {label: "Cursos", to: "/courses/list"},
            {label: "Detalles", to: pathname},
        ];
    }

    if (/^\/users\/\d+/.test(pathname)) {
        return [
            {label: "Gestión de usuarios", to: "/users"},
            {label: "Usuarios", to: "/users"},
            {label: "Detalles", to: pathname},
        ];
    }
    if (/^\/users\/roles\/\d+/.test(pathname)) {
        return [
            {label: "Gestión de usuarios", to: "/users"},
            {label: "Roles", to: "/users/roles"},
            {label: "Detalles", to: pathname},
        ];
    }


    if (pathname.startsWith("/courses/templates")) {
        return [{label: "Cursos base", to: "/courses/templates"}];
    }

    if (pathname.startsWith("/courses")) {
        if (pathname === "/courses/list") return [{label: "Cursos", to: "/courses/list"}];
        return [{label: "Cursos", to: "/courses/list"}, {label: "Detalles", to: pathname}];
    }

    if (pathname.startsWith("/subjects")) return [{label: "Materias", to: pathname}];
    if (pathname.startsWith("/help")) return [{label: "Ayuda", to: "/help"}];
    if (pathname.startsWith("/catalog")) {
        if (/^\/catalog\/products\/\d+/.test(pathname)) return [{label: "Conceptos de pago", to: "/catalog/products"}, {label: "Detalles", to: pathname}];
        if (pathname.startsWith("/catalog/categories")) return [{label: "Categorías de pago", to: pathname}];
        if (pathname.startsWith("/catalog/taxes")) return [{label: "Impuestos", to: pathname}];
        return [{label: "Conceptos de pago", to: pathname}];
    }

    if (pathname.startsWith("/payments")) return [{label: "Pagos recibidos", to: "/payments/list"}];
    if (pathname.startsWith("/invoices")) return [{label: "Facturas emitidas", to: "/invoices/list"}];
    if (pathname.startsWith("/accounts")) {
        if (pathname === "/accounts/list") return [{label: "Estados de cuenta", to: pathname}];
        return [{label: "Estados de cuenta", to: "/accounts/list"}, {label: "Estado de cuenta", to: pathname}];
    }
    if (pathname.startsWith("/enrollments")) return [{label: "Inscripciones", to: pathname}];
    if (/^\/students\/\d+/.test(pathname)) return [{label: "Estudiantes", to: "/students/list"}, {label: "Detalles", to: pathname}];
    if (pathname.startsWith("/students")) return [{label: "Estudiantes", to: pathname}];
    if (pathname.startsWith("/guardians")) {
        return [{label: "Representantes", to: "/guardians/list"}];
    }
    if (pathname.startsWith("/users")) {
        if (pathname === "/users") return [{label: "Gestión de usuarios", to: "/users"}, {label: "Usuarios", to: "/users"}];
        if (pathname.startsWith("/users/roles")) return [{label: "Gestión de usuarios", to: "/users"}, {label: "Roles", to: pathname}];
        if (pathname.startsWith("/users/authorities")) return [{label: "Gestión de usuarios", to: "/users"}, {label: "Permisos", to: pathname}];
        if (pathname.startsWith("/users/invitations")) return [{label: "Gestión de usuarios", to: "/users"}, {label: "Invitaciones", to: pathname}];
        return [{label: "Gestión de usuarios", to: "/users"}, {label: "Usuarios", to: pathname}];
    }
    if (pathname.startsWith("/specializations")) return [{label: "Áreas especializadas", to: pathname}];
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

                <main id="content" role="main" className="app-shell-content" data-tone={resolveRouteTone(location.pathname)}>
                    <div className="app-shell-content-inner">
                        <RouteErrorBoundary resetKey={location.pathname}>
                            <Suspense fallback={<LoadingContent loading className="min-h-[50vh]"/>}>
                                <Outlet/>
                            </Suspense>
                        </RouteErrorBoundary>
                    </div>
                </main>
            </div>
            <AssistantChat/>
        </div>
    );
};
