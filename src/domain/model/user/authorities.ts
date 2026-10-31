export enum AuthorityKey {
    CONFIGURATION = "CONFIGURATION",
    ORGANIZATIONS_VIEW = "ORGANIZATIONS_VIEW",
    ORGANIZATION_CREATE = "ORGANIZATION_CREATE",
    ORGANIZATION_EDIT = "ORGANIZATION_EDIT",
    ORGANIZATION_DELETE = "ORGANIZATION_DELETE",
    ORGANIZATION_STATUS_UPDATE = "ORGANIZATION_STATUS_UPDATE",
    DASHBOARD_VIEW = "DASHBOARD_VIEW",
    STUDENTS_VIEW = "STUDENTS_VIEW",
    STUDENT_CREATE = "STUDENT_CREATE",
    COURSES_VIEW = "COURSES_VIEW",
    COURSE_DETAILS_VIEW = "COURSE_DETAILS_VIEW",
    GRADES_VIEW = "GRADES_VIEW",
    SPECIALIZATIONS_VIEW = "SPECIALIZATIONS_VIEW",
    SPECIALIZATION_CREATE = "SPECIALIZATION_CREATE",
    SPECIALIZATION_EDIT = "SPECIALIZATION_EDIT",
    SPECIALIZATION_DETAILS_VIEW = "SPECIALIZATION_DETAILS_VIEW",
    SPECIALIZATION_STATUS_UPDATE = "SPECIALIZATION_STATUS_UPDATE",
    COLLECTION_CREATE = "COLLECTION_CREATE",
    PAYMENTS_VIEW = "PAYMENTS_VIEW",
    INVOICES_VIEW = "INVOICES_VIEW",
    INVOICE_CREATE = "INVOICE_CREATE",
    INVOICE_VOID = "INVOICE_VOID",
    PAYMENT_VOID = "PAYMENT_VOID",
    ASSISTANT_USE = "ASSISTANT_USE",
    TUITION_VIEW = "TUITION_VIEW",
    DISCOUNTS_VIEW = "DISCOUNTS_VIEW",
    ENROLLMENTS_VIEW = "ENROLLMENTS_VIEW",
    ENROLLMENT_CREATE = "ENROLLMENT_CREATE",
    USERS_VIEW = "USERS_VIEW",
    USER_DETAILS_VIEW = "USER_DETAILS_VIEW",
    USER_EDIT = "USER_EDIT",
    USER_STATUS_UPDATE = "USER_STATUS_UPDATE",
    USER_INVITATIONS_VIEW = "USER_INVITATIONS_VIEW",
    USER_INVITATION_CREATE = "USER_INVITATION_CREATE",
    ROLES_VIEW = "ROLES_VIEW",
    ROLE_CREATE = "ROLE_CREATE",
    ROLE_DETAILS_VIEW = "ROLE_DETAILS_VIEW",
    ROLE_ASSIGN_AUTHORITIES = "ROLE_ASSIGN_AUTHORITIES",

    AUTHORITIES_VIEW = "AUTHORITIES_VIEW",
    AUTHORITY_CREATE = "AUTHORITY_CREATE",

    GUARDIANS_VIEW = "GUARDIANS_VIEW",
    GUARDIAN_CREATE = "GUARDIAN_CREATE",
    GUARDIAN_DETAILS_VIEW = "GUARDIAN_DETAILS_VIEW",

    TEACHERS_VIEW = "TEACHERS_VIEW",
    TEACHER = "TEACHER",
    CATALOG_VIEW = "CATALOG_VIEW",
    CATALOG_EDIT = "CATALOG_EDIT",

    COURSE_TEMPLATES_VIEW = "COURSE_TEMPLATES_VIEW",
    COURSE_TEMPLATE_CREATE = "COURSE_TEMPLATE_CREATE",
    COURSE_TEMPLATE_EDIT = "COURSE_TEMPLATE_EDIT",
    COURSE_TEMPLATE_DETAILS_VIEW = "COURSE_TEMPLATE_DETAILS_VIEW",
    COURSE_GENERATE = "COURSE_GENERATE",


    SUBJECTS_VIEW = "SUBJECTS_VIEW",
    SUBJECT_CREATE = "SUBJECT_CREATE",
    SUBJECT_EDIT = "SUBJECT_EDIT",
    SUBJECT_STATUS_UPDATE = "SUBJECT_STATUS_UPDATE",

    REPORTS_VIEW = "REPORTS_VIEW",
    HELP_VIEW = "HELP_VIEW",
}

export const AuthorityDescriptionMap: Record<AuthorityKey, string> = {
    [AuthorityKey.CONFIGURATION]: "Permite consultar, modificar y ejecutar las configuraciones de la organización.",
    [AuthorityKey.ORGANIZATIONS_VIEW]: "Permite ver las organizaciones del sistema.",
    [AuthorityKey.ORGANIZATION_CREATE]: "Permite crear organizaciones.",
    [AuthorityKey.ORGANIZATION_EDIT]: "Permite editar organizaciones.",
    [AuthorityKey.ORGANIZATION_DELETE]: "Permite eliminar organizaciones.",
    [AuthorityKey.ORGANIZATION_STATUS_UPDATE]: "Permite cambiar el estado de las organizaciones.",
    [AuthorityKey.DASHBOARD_VIEW]: "Permite ver el dashboard principal del sistema.",

    [AuthorityKey.STUDENTS_VIEW]: "Permite ver el listado de estudiantes.",
    [AuthorityKey.STUDENT_CREATE]: "Permite registrar estudiantes desde los flujos habilitados del sistema.",

    [AuthorityKey.COURSES_VIEW]: "Permite ver el listado de cursos.",
    [AuthorityKey.COURSE_DETAILS_VIEW]: "Permite acceder a la pantalla de detalles de un curso.",

    [AuthorityKey.GRADES_VIEW]: "Permite acceder al módulo de calificaciones.",

    [AuthorityKey.SPECIALIZATIONS_VIEW]: "Permite ver el listado de áreas especializadas.",
    [AuthorityKey.SPECIALIZATION_CREATE]: "Permite crear nuevas áreas especializadas.",
    [AuthorityKey.SPECIALIZATION_EDIT]: "Permite editar áreas especializadas existentes.",
    [AuthorityKey.SPECIALIZATION_DETAILS_VIEW]: "Permite acceder a los detalles de un área especializada.",
    [AuthorityKey.SPECIALIZATION_STATUS_UPDATE]: "Permite activar o inactivar áreas especializadas.",


    [AuthorityKey.COLLECTION_CREATE]: "Permite registrar pagos de las familias.",
    [AuthorityKey.PAYMENTS_VIEW]: "Permite ver el listado de pagos y cobros registrados.",
    [AuthorityKey.INVOICES_VIEW]: "Permite ver facturas y estados de cuenta.",
    [AuthorityKey.INVOICE_CREATE]: "Permite facturar conceptos de pago a un estudiante.",
    [AuthorityKey.INVOICE_VOID]: "Permite anular facturas que no tienen pagos.",
    [AuthorityKey.PAYMENT_VOID]: "Permite anular recibos de pago.",
    [AuthorityKey.ASSISTANT_USE]: "Permite usar el chat del asistente de IA.",
    [AuthorityKey.TUITION_VIEW]: "Permite acceder al módulo de pendientes de cobro.",
    [AuthorityKey.DISCOUNTS_VIEW]: "Permite acceder al módulo de descuentos.",

    [AuthorityKey.ENROLLMENTS_VIEW]: "Permite ver el listado de inscripciones.",
    [AuthorityKey.ENROLLMENT_CREATE]: "Permite registrar nuevas inscripciones.",

    [AuthorityKey.USERS_VIEW]: "Permite ver el listado de usuarios.",
    [AuthorityKey.USER_DETAILS_VIEW]: "Permite acceder a los detalles de un usuario.",
    [AuthorityKey.USER_EDIT]: "Permite editar la información de un usuario.",
    [AuthorityKey.USER_STATUS_UPDATE]: "Permite cambiar el estado de un usuario.",

    [AuthorityKey.USER_INVITATIONS_VIEW]: "Permite ver el listado de invitaciones de usuarios.",
    [AuthorityKey.USER_INVITATION_CREATE]: "Permite enviar nuevas invitaciones de usuario.",

    [AuthorityKey.ROLES_VIEW]: "Permite ver el listado de roles.",
    [AuthorityKey.ROLE_CREATE]: "Permite crear nuevos roles.",
    [AuthorityKey.ROLE_DETAILS_VIEW]: "Permite acceder a los detalles de un rol.",
    [AuthorityKey.ROLE_ASSIGN_AUTHORITIES]: "Permite asignar o desasignar permisos a un rol.",

    [AuthorityKey.AUTHORITIES_VIEW]: "Permite ver el listado de permisos del sistema.",
    [AuthorityKey.AUTHORITY_CREATE]: "Permite crear nuevos permisos del sistema.",

    [AuthorityKey.GUARDIANS_VIEW]: "Permite ver el listado de representantes.",
    [AuthorityKey.GUARDIAN_CREATE]: "Permite registrar nuevos representantes.",
    [AuthorityKey.GUARDIAN_DETAILS_VIEW]: "Permite acceder a los detalles de un representante.",

    [AuthorityKey.TEACHERS_VIEW]: "Permite acceder al módulo de profesores.",
    [AuthorityKey.TEACHER]: "Identifica usuarios elegibles para impartir clases.",
    [AuthorityKey.CATALOG_VIEW]: "Permite ver los conceptos de pago, sus categorías e impuestos.",
    [AuthorityKey.CATALOG_EDIT]: "Permite crear y editar conceptos de pago, categorías, impuestos y precios.",

    [AuthorityKey.COURSE_TEMPLATES_VIEW]: "Permite ver el listado de plantillas de cursos.",
    [AuthorityKey.COURSE_TEMPLATE_CREATE]: "Permite crear nuevas plantillas de cursos.",
    [AuthorityKey.COURSE_TEMPLATE_EDIT]: "Permite editar plantillas de cursos existentes.",
    [AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW]: "Permite acceder a los detalles de una plantilla de curso.",
    [AuthorityKey.COURSE_GENERATE]: "Permite generar los cursos de una plantilla para el período académico actual.",


    [AuthorityKey.SUBJECTS_VIEW]: "Permite ver el listado de materias.",
    [AuthorityKey.SUBJECT_CREATE]: "Permite crear nuevas materias.",
    [AuthorityKey.SUBJECT_EDIT]: "Permite editar materias existentes.",
    [AuthorityKey.SUBJECT_STATUS_UPDATE]: "Permite activar o inactivar materias.",

    [AuthorityKey.REPORTS_VIEW]: "Permite acceder a la opcion de reportes.",
    [AuthorityKey.HELP_VIEW]: "Permite acceder a la opcion de ayuda.",
};

export type AuthorityCatalogItem = {
    key: AuthorityKey;
    description: string;
};

export const AuthorityCatalog: AuthorityCatalogItem[] = Object.values(AuthorityKey).map((key) => ({
    key,
    description: AuthorityDescriptionMap[key],
}));
