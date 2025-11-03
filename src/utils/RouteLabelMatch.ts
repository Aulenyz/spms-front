export interface RouteLabelMatch {
    label: string;
    basePath: string;
}

export const routesConfig: RouteLabelMatch[] = [
    {basePath: '/home', label: 'INICIO'},
    {basePath: '/users', label: 'Lista de Empleados'},
    {basePath: '/zones', label: 'Lista de Zonas'},
    {basePath: '/customers', label: 'Lista de Clientes'},
    {basePath: '/positions', label: 'Lista de Posiciones'},
    {basePath: '/assignments', label: 'Historial de Jornadas'},
    {basePath: '/branches', label: 'Listado de Sucursales'},
    {basePath: '/reports', label: 'Cobertura de Posiciones'},
    {basePath: '/services', label: 'Cobertura de Servicios'},
    {basePath: '/organizations', label: 'Gestión de Organizacion'},
    {basePath: '/routes', label: 'Historial Recorridos'},
    {basePath: '/images', label: 'Auditoría de Imágenes'},
    {basePath: '/roles', label: 'Ajustes del Sistema'},
    {basePath: '/roles/notifications', label: 'Centro de Notificaciones'},
    {basePath: '/notifications', label: 'Notificaciones'},
];

export const dynamicRouteGroups = [
    {
        base: '/users',
        children: [
            {suffix: 'details', label: 'Detalles del Empleado'},
            {suffix: 'assignments', label: 'Historial de Jornadas'},
            {suffix: 'news', label: 'Novedades de Empleado'},
            {suffix: 'leaves', label: 'Solicitudes de Empleado'},
        ],
    },
    {
        base: '/zones',
        children: [
            {suffix: 'dashboard', label: 'Dashboard de la Zona'},
            {suffix: 'positions', label: 'Posiciones de la Zona'},
            {suffix: 'employees', label: 'Empleados de la Zona'},
            {suffix: 'news', label: 'Novedades de la Zona'},
        ],
    },
    {
        base: '/customers',
        children: [
            {suffix: 'positions', label: 'Posiciones del Cliente'},
            {suffix: 'placements', label: 'Jornadas del Cliente'},
            {suffix: 'news', label: 'Novedades del Cliente'},
        ],
    },
    {
        base: '/positions',
        children: [
            {suffix: 'assignments', label: 'Jornadas de la Posición'},
            {suffix: 'details', label: 'Calendario de la Posición'},
            {suffix: 'news', label: 'Novedades de la Posición'},
        ],
    },
    {
        base: '/assignments',
        children: [
            {suffix: 'assignations', label: 'Lista de Asignaciones'},
            {suffix: 'rounds', label: 'Historial de Rondas'},
            {suffix: 'reports', label: 'Reporte de Jornada'},
        ],
    },
    {
        base: '/branches',
        children: [
            {suffix: 'positions', label: 'Posiciones de Sucursal'},
            {suffix: 'assignments', label: 'Horario de Recorridos'},
            {suffix: 'areas', label: 'Áreas de Recorridos'},
            {suffix: 'checkpoints', label: 'Puntos de Chequeo'},
            {suffix: 'novelties', label: 'Novedades de Sucursal'},
        ],
    },
    {
        base: '/organizations',
        children: [
            {suffix: 'details', label: 'Detalles de Organización'},
        ],
    },
    {
        base: '/roles',
        children: [
            {suffix: '', label: ''},
        ],
    }
];

// Build dynamic route patterns with their display labels
export const dynamicRoutes: { pattern: RegExp; label: string }[] = dynamicRouteGroups.flatMap(
    ({base, children}) =>
        children.map(({suffix, label}) => ({
            pattern: new RegExp(`^${base}/\\d+/${suffix}$`),
            label,
        }))
);

// Get the display label and base path for a given pathname
export const getRouteLabel = (pathname: string): RouteLabelMatch | undefined => {
    // Match dynamic routes (Example /users/1/details)
    const dynamic = dynamicRoutes.find(({pattern}) => pattern.test(pathname));

    // Find matching base Route
    if (dynamic) {
        const base = routesConfig.find((route) => pathname.startsWith(route.basePath));
        return {label: dynamic.label, basePath: base?.basePath || ''};
    }

    // Match static routes (Example /users)
    const staticMatch = routesConfig
        .sort((a, b) => b.basePath.length - a.basePath.length)
        .find(({basePath}) => pathname.startsWith(basePath));

    // Return match or undefined
    return staticMatch ? {label: staticMatch.label, basePath: staticMatch.basePath} : undefined;
}