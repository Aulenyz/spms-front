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
        title: "Operacion",
        items: [
            {
                label: "Inscripciones",
                icon: "fa-file-signature",
                to: "/enrollments/list",
            },
            {
                label: "Estudiantes",
                icon: "fa-user-graduate",
                to: "/students/list",
            },
            {
                label: "Pagos",
                icon: "fa-wallet",
                to: "/payments/list",
            },
            {
                label: "Unidades",
                icon: "fa-book-open",
                to: "/specializations/list",
            },
        ],
    },
    {
        title: "Configuracion",
        items: [
            {
                label: "Nueva cobranza",
                icon: "fa-receipt",
                action: "collection",
                badge: "Nuevo",
            },
            {
                label: "Usuarios",
                icon: "fa-users-gear",
                to: "/users",
            },
            {
                label: "Plantillas",
                icon: "fa-layer-group",
                to: "/courses/templates",
            },
        ],
    },
];

export const secondaryQuickLinks: NavigationItem[] = [
    {label: "Reportes", icon: "fa-file-lines"},
    {label: "Ayuda", icon: "fa-life-ring"},
];
