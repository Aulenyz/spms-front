import {AuthorityKey} from "../../domain/model/user/authorities.ts";

export type NavigationItem = {
    label: string;
    icon: string;
    to?: string;
    badge?: string;
    action?: "collection";
    authority?: AuthorityKey;
    /** Solo visible si la organización tiene la función activa. */
    feature?: "taxes";
};

/** Color de identidad de cada módulo; ver `[data-tone]` en index.css. */
export type NavigationTone = "sky" | "violet" | "emerald" | "pink" | "amber" | "teal" | "indigo";

export type NavigationSection = {
    title: string;
    tone: NavigationTone;
    items: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
    {
        title: "Inicio",
        tone: "sky",
        items: [
            {
                label: "Dashboard",
                icon: "fa-chart-line",
                to: "/home",
                authority: AuthorityKey.DASHBOARD_VIEW,
            },
        ],
    },
    {
        title: "Gestión académica",
        tone: "violet",
        items: [
            {
                label: "Estudiantes",
                icon: "fa-user-graduate",
                to: "/students/list",
                authority: AuthorityKey.STUDENTS_VIEW,
            },
            {
                label: "Cursos",
                icon: "fa-book",
                to: "/courses/list",
                authority: AuthorityKey.COURSES_VIEW,
            },
        ],
    },
    {
        title: "Finanzas",
        tone: "emerald",
        items: [
            {
                label: "Registrar pago",
                icon: "fa-receipt",
                action: "collection",
                authority: AuthorityKey.COLLECTION_CREATE,
            },
            {
                label: "Pagos recibidos",
                icon: "fa-hand-holding-dollar",
                to: "/payments/list",
                authority: AuthorityKey.PAYMENTS_VIEW,
            },
            {
                label: "Facturas emitidas",
                icon: "fa-file-invoice-dollar",
                to: "/invoices/list",
                authority: AuthorityKey.INVOICES_VIEW,
            },
            {
                label: "Estados de cuenta",
                icon: "fa-scale-balanced",
                to: "/accounts/list",
                authority: AuthorityKey.INVOICES_VIEW,
            },
            {
                label: "Conceptos de pago",
                icon: "fa-tags",
                to: "/catalog/products",
                authority: AuthorityKey.CATALOG_VIEW,
            },
            {
                label: "Categorías de pago",
                icon: "fa-folder-tree",
                to: "/catalog/categories",
                authority: AuthorityKey.CATALOG_VIEW,
            },
            {
                label: "Impuestos",
                icon: "fa-percent",
                to: "/catalog/taxes",
                authority: AuthorityKey.CATALOG_VIEW,
                feature: "taxes",
            },
        ],
    },
    {
        title: "Administración",
        tone: "pink",
        items: [
            {
                label: "Inscripciones",
                icon: "fa-file-signature",
                to: "/enrollments/list",
                authority: AuthorityKey.ENROLLMENTS_VIEW,
            },
            {
                label: "Representantes",
                icon: "fa-people-roof",
                to: "/guardians/list",
                authority: AuthorityKey.GUARDIANS_VIEW,
            },
        ],
    },
    {
        title: "Configuración académica",
        tone: "amber",
        items: [
            {
                label: "Cursos base",
                icon: "fa-layer-group",
                to: "/courses/templates",
                authority: AuthorityKey.COURSE_TEMPLATES_VIEW,
            },
            {
                label: "Materias",
                icon: "fa-book-open",
                to: "/subjects/list",
                authority: AuthorityKey.SUBJECTS_VIEW,
            },
            {
                label: "Áreas especializadas",
                icon: "fa-shapes",
                to: "/specializations/list",
                authority: AuthorityKey.SPECIALIZATIONS_VIEW,
            },
        ],
    },
    {
        title: "Configuración del sistema",
        tone: "indigo",
        items: [
            {label: "Gestión Usuarios", icon: "fa-users-gear", to: "/users", authority: AuthorityKey.USERS_VIEW},
            {
                label: "Gestión Organizaciones",
                icon: "fa-building",
                to: "/organizations",
                authority: AuthorityKey.ORGANIZATIONS_VIEW
            },
        ],
    },
];

export const secondaryQuickLinks: NavigationItem[] = [
    {
        label: "Reportes",
        icon: "fa-file-lines",
        authority: AuthorityKey.REPORTS_VIEW,
    },
    {
        label: "Ayuda",
        icon: "fa-life-ring",
        to: "/help",
        authority: AuthorityKey.HELP_VIEW,
    },
];

type AuthorityResolver = (authority?: AuthorityKey) => boolean;

const defaultAuthorizedRoutes: Array<{ to: string; authority: AuthorityKey }> = [
    {to: "/home", authority: AuthorityKey.DASHBOARD_VIEW},
    {to: "/students/list", authority: AuthorityKey.STUDENTS_VIEW},
    {to: "/courses/list", authority: AuthorityKey.COURSES_VIEW},
    {to: "/specializations/list", authority: AuthorityKey.SPECIALIZATIONS_VIEW},
    {to: "/enrollments/list", authority: AuthorityKey.ENROLLMENTS_VIEW},
    {to: "/payments/list", authority: AuthorityKey.PAYMENTS_VIEW},
    {to: "/users", authority: AuthorityKey.USERS_VIEW},
    {to: "/users/roles", authority: AuthorityKey.ROLES_VIEW},
    {to: "/users/authorities", authority: AuthorityKey.AUTHORITIES_VIEW},
    {to: "/users/invitations", authority: AuthorityKey.USER_INVITATIONS_VIEW},
    {to: "/guardians/list", authority: AuthorityKey.GUARDIANS_VIEW},
    {to: "/subjects/list", authority: AuthorityKey.SUBJECTS_VIEW},
    {to: "/courses/templates", authority: AuthorityKey.COURSE_TEMPLATES_VIEW},
    {to: "/help", authority: AuthorityKey.HELP_VIEW},
    {to: "/organizations", authority: AuthorityKey.ORGANIZATIONS_VIEW},
];

export const resolveFirstAuthorizedPath = (canAccess: AuthorityResolver): string | undefined => {
    return defaultAuthorizedRoutes.find((item) => canAccess(item.authority))?.to;
};

/**
 * Tono del módulo al que pertenece la ruta: la sección cuyo enlace comparte el prefijo más largo.
 * Las rutas sin sección (ayuda, reportes, organizaciones) usan el tono por defecto.
 */
/** Rutas de un módulo que no aparecen en el menú. */
const extraRouteTones: Array<{ to: string; tone: NavigationTone; icon: string }> = [
    {to: "/payments", tone: "emerald", icon: "fa-wallet"},
    {to: "/catalog", tone: "emerald", icon: "fa-box-open"},
    {to: "/organizations", tone: "indigo", icon: "fa-building"},
    {to: "/help", tone: "teal", icon: "fa-life-ring"},
];

export type RouteModule = { tone: NavigationTone; icon: string };

/** Módulo (color e ícono) de la ruta, para que cada página muestre a qué sección pertenece. */
export const resolveRouteModule = (pathname: string): RouteModule => {
    let best: RouteModule & { length: number } = {tone: "indigo", icon: "fa-compass", length: 0};
    const matches = (to: string) => pathname === to || pathname.startsWith(to + "/");
    extraRouteTones.forEach((route) => {
        if (matches(route.to) && route.to.length > best.length)
            best = {tone: route.tone, icon: route.icon, length: route.to.length};
    });
    navigationSections.forEach((section) => section.items.forEach((item) => {
        if (!item.to) return;
        const base = item.to.replace(/\/list$/, "");
        if (matches(base) && base.length > best.length)
            best = {tone: section.tone, icon: item.icon, length: base.length};
    }));
    return {tone: best.tone, icon: best.icon};
};

export const resolveRouteTone = (pathname: string): NavigationTone => resolveRouteModule(pathname).tone;
