export type NavigationItem = {
    label: string;
    icon: string;
    to?: string;
    badge?: string;
    action?: "collection";
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
            },
            {
                label: "Cursos",
                icon: "fa-book",
                to: "/courses/list",
            },
            {
                label: "Calificaciones",
                icon: "fa-clipboard-check",
                to: "/grades/list",
            },
            {
                label: "Áreas especializadas",
                icon: "fa-shapes",
                to: "/specializations/list",
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
            },
            {
                label: "Mi horario",
                icon: "fa-calendar-days",
                to: "/teacher/schedule",
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
            },
            {
                label: "Facturas",
                icon: "fa-file-invoice-dollar",
                to: "/invoices/list",
            },
            {
                label: "Pendientes de cobro",
                icon: "fa-calendar-check",
                to: "/tuition/list",
            },
            {
                label: "Descuentos",
                icon: "fa-tags",
                to: "/discounts/list",
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
            },
            {
                label: "Gestión Usuarios",
                icon: "fa-users-gear",
                to: "/users",
            },
            {
                label: "Padres / Tutores",
                icon: "fa-people-roof",
                to: "/guardians/list",
            },
            {
                label: "Profesores",
                icon: "fa-chalkboard-user",
                to: "/teachers/list",
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
            },
            {
                label: "Materias",
                icon: "fa-book-open",
                to: "/subjects/list",
            },
            {
                label: "Precios",
                icon: "fa-tags",
                to: "/courses/templates/prices",
            },
            {
                label: "Materiales",
                icon: "fa-boxes-stacked",
                to: "/courses/templates/materials",
            },
        ],
    },
];

export const secondaryQuickLinks: NavigationItem[] = [
    {
        label: "Reportes",
        icon: "fa-file-lines",
    },
    {
        label: "Ayuda",
        icon: "fa-life-ring",
    },
];
