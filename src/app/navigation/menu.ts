import {AuthorityKey} from "../../domain/model/user/authorities.ts";

export type NavigationItem = {
    label: string;
    icon: string;
    to?: string;
    badge?: string;
    action?: "collection";
    authority?: AuthorityKey;
};

export type NavigationSection = {
    title: string;
    items: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
    {
        title: "Inicio",
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
            {
                label: "Calificaciones",
                icon: "fa-clipboard-check",
                to: "/grades/list",
                authority: AuthorityKey.GRADES_VIEW,
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
        title: "Gestión docente",
        items: [
            {
                label: "Mis clases",
                icon: "fa-chalkboard",
                to: "/teacher/classes",
                authority: AuthorityKey.TEACHER_CLASSES_VIEW,
            },
            {
                label: "Mi horario",
                icon: "fa-calendar-days",
                to: "/teacher/schedule",
                authority: AuthorityKey.TEACHER_SCHEDULE_VIEW,
            },
        ],
    },
    {
        title: "Finanzas",
        items: [
            {
                label: "Nueva cobranza",
                icon: "fa-receipt",
                action: "collection",
                badge: "Nuevo",
                authority: AuthorityKey.COLLECTION_CREATE,
            },
            {
                label: "Facturas",
                icon: "fa-file-invoice-dollar",
                to: "/invoices/list",
                authority: AuthorityKey.INVOICES_VIEW,
            },
            {
                label: "Pendientes de cobro",
                icon: "fa-calendar-check",
                to: "/tuition/list",
                authority: AuthorityKey.TUITION_VIEW,
            },
            {
                label: "Descuentos",
                icon: "fa-tags",
                to: "/discounts/list",
                authority: AuthorityKey.DISCOUNTS_VIEW,
            },
        ],
    },
    {
        title: "Administración",
        items: [
            {
                label: "Inscripciones",
                icon: "fa-file-signature",
                to: "/enrollments/list",
                authority: AuthorityKey.ENROLLMENTS_VIEW,
            },
            {
                label: "Gestión Usuarios",
                icon: "fa-users-gear",
                to: "/users",
                authority: AuthorityKey.USERS_VIEW,
            },
            {
                label: "Padres / Tutores",
                icon: "fa-people-roof",
                to: "/guardians/list",
                authority: AuthorityKey.GUARDIANS_VIEW,
            },
            {
                label: "Profesores",
                icon: "fa-chalkboard-user",
                to: "/teachers/list",
                authority: AuthorityKey.TEACHERS_VIEW,
            },
        ],
    },
    {
        title: "Configuración académica",
        items: [
            {
                label: "Cursos",
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
                label: "Precios",
                icon: "fa-tags",
                to: "/courses/templates/prices",
                authority: AuthorityKey.PRICE_TEMPLATES_VIEW,
            },
            {
                label: "Materiales",
                icon: "fa-boxes-stacked",
                to: "/courses/templates/materials",
                authority: AuthorityKey.MATERIAL_TEMPLATES_VIEW,
            },
        ],
    },
    {
        title: "Recursos educativos",
        items: [
            {
                label: "Recursos",
                icon: "fa-box-open",
                to: "/catalog/products",
            },
            {
                label: "Categorías",
                icon: "fa-folder-tree",
                to: "/catalog/categories",
            },
            {
                label: "Kits y colecciones",
                icon: "fa-boxes-stacked",
                to: "/catalog/collections",
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

const defaultAuthorizedRoutes: Array<{to: string; authority: AuthorityKey}> = [
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
    {to: "/courses/templates/prices", authority: AuthorityKey.PRICE_TEMPLATES_VIEW},
    {to: "/courses/templates/materials", authority: AuthorityKey.MATERIAL_TEMPLATES_VIEW},
    {to: "/help", authority: AuthorityKey.HELP_VIEW},
];

export const resolveFirstAuthorizedPath = (canAccess: AuthorityResolver): string | undefined => {
    return defaultAuthorizedRoutes.find((item) => canAccess(item.authority))?.to;
};
