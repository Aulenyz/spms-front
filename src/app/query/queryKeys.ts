/**
 * Claves de react-query centralizadas. Convención: [recurso, ámbito, ...parámetros].
 * Invalidar `queryKeys.<recurso>.all` refresca todas las variantes (listas, detalles, totales).
 */
export const queryKeys = {
    period: {
        all: ['periods'] as const,
        current: (organizationId?: string) => ['periods', 'current', organizationId ?? null] as const,
        search: (params: unknown) => ['periods', 'search', params] as const,
    },
    organizationConfiguration: {
        all: ['organization-configuration'] as const,
    },
    organizations: {
        all: ['organizations'] as const,
        list: (params: unknown) => ['organizations', 'list', params] as const,
        mine: ['organizations', 'mine'] as const,
    },
    students: {
        all: ['students'] as const,
        list: (params: unknown) => ['students', 'list', params] as const,
        totals: ['students', 'totals'] as const,
    },
    users: {
        all: ['users'] as const,
        list: (params: unknown) => ['users', 'list', params] as const,
        totals: ['users', 'totals'] as const,
    },
    roles: {
        all: ['roles'] as const,
        list: (params: unknown) => ['roles', 'list', params] as const,
        search: (params: unknown) => ['roles', 'search', params] as const,
    },
    authorities: {
        all: ['authorities'] as const,
        list: (params: unknown) => ['authorities', 'list', params] as const,
    },
    invitations: {
        all: ['invitations'] as const,
        list: (params: unknown) => ['invitations', 'list', params] as const,
    },
    guardians: {
        all: ['guardians'] as const,
        list: (params: unknown) => ['guardians', 'list', params] as const,
    },
    courses: {
        all: ['courses'] as const,
        list: (params: unknown) => ['courses', 'list', params] as const,
    },
    courseTemplates: {
        all: ['course-templates'] as const,
        list: (params: unknown) => ['course-templates', 'list', params] as const,
    },
    specializations: {
        all: ['specializations'] as const,
        list: (params: unknown) => ['specializations', 'list', params] as const,
    },
    subjects: {
        all: ['subjects'] as const,
        list: (params: unknown) => ['subjects', 'list', params] as const,
    },
    products: {
        all: ['products'] as const,
        list: (params: unknown) => ['products', 'list', params] as const,
        totals: ['products', 'totals'] as const,
    },
    taxes: ['tax-categories'] as const,
    categories: {
        all: ['product-categories'] as const,
        list: (params: unknown) => ['product-categories', 'list', params] as const,
        totals: ['product-categories', 'totals'] as const,
    },
    invoices: {
        all: ['invoices'] as const,
        list: (params: unknown) => ['invoices', 'list', params] as const,
        open: (studentId?: number) => ['invoices', 'open', studentId ?? null] as const,
        details: (id: number | string) => ['invoices', 'details', String(id)] as const,
    },
    accounts: {
        all: ['accounts'] as const,
        list: (params: unknown) => ['accounts', 'list', params] as const,
        statement: (studentId: number | string) => ['accounts', 'statement', String(studentId)] as const,
        summary: ['accounts', 'summary'] as const,
    },
    payments: {
        all: ['payments'] as const,
        details: (id: number | string) => ['payments', 'details', String(id)] as const,
        list: (params: unknown) => ['payments', 'list', params] as const,
        totals: (periodId?: number) => ['payments', 'totals', periodId ?? null] as const,
    },
    enrollments: {
        all: ['enrollments'] as const,
        list: (params: unknown) => ['enrollments', 'list', params] as const,
        totals: (periodId?: number) => ['enrollments', 'totals', periodId ?? null] as const,
        preview: (studentId?: number, courseId?: number) => ['enrollments', 'preview', studentId ?? null, courseId ?? null] as const,
    },
};
