export enum AuthorityKey {
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
    TEACHER_CLASSES_VIEW = "TEACHER_CLASSES_VIEW",
    TEACHER_SCHEDULE_VIEW = "TEACHER_SCHEDULE_VIEW",
    COLLECTION_CREATE = "COLLECTION_CREATE",
    PAYMENTS_VIEW = "PAYMENTS_VIEW",
    INVOICES_VIEW = "INVOICES_VIEW",
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

    COURSE_TEMPLATES_VIEW = "COURSE_TEMPLATES_VIEW",
    COURSE_TEMPLATE_CREATE = "COURSE_TEMPLATE_CREATE",
    COURSE_TEMPLATE_EDIT = "COURSE_TEMPLATE_EDIT",
    COURSE_TEMPLATE_DETAILS_VIEW = "COURSE_TEMPLATE_DETAILS_VIEW",

    PRICE_TEMPLATES_VIEW = "PRICE_TEMPLATES_VIEW",
    MATERIAL_TEMPLATES_VIEW = "MATERIAL_TEMPLATES_VIEW",

    SUBJECTS_VIEW = "SUBJECTS_VIEW",
    SUBJECT_CREATE = "SUBJECT_CREATE",
    SUBJECT_EDIT = "SUBJECT_EDIT",
    SUBJECT_STATUS_UPDATE = "SUBJECT_STATUS_UPDATE",

    REPORTS_VIEW = "REPORTS_VIEW",
    HELP_VIEW = "HELP_VIEW",
}

export const AuthorityDescriptionMap: Record<AuthorityKey, string> = {
    [AuthorityKey.DASHBOARD_VIEW]: "Permite ver el dashboard principal del sistema.",

    [AuthorityKey.STUDENTS_VIEW]: "Permite ver el listado de estudiantes.",
    [AuthorityKey.STUDENT_CREATE]: "Permite registrar estudiantes desde los flujos habilitados del sistema.",

    [AuthorityKey.COURSES_VIEW]: "Permite ver el listado de cursos.",
    [AuthorityKey.COURSE_DETAILS_VIEW]: "Permite acceder a la pantalla de detalles de un curso.",

    [AuthorityKey.GRADES_VIEW]: "Permite acceder al modulo de calificaciones.",

    [AuthorityKey.SPECIALIZATIONS_VIEW]: "Permite ver el listado de areas especializadas.",
    [AuthorityKey.SPECIALIZATION_CREATE]: "Permite crear nuevas areas especializadas.",
    [AuthorityKey.SPECIALIZATION_EDIT]: "Permite editar areas especializadas existentes.",
    [AuthorityKey.SPECIALIZATION_DETAILS_VIEW]: "Permite acceder a los detalles de un area especializada.",
    [AuthorityKey.SPECIALIZATION_STATUS_UPDATE]: "Permite activar o inactivar areas especializadas.",

    [AuthorityKey.TEACHER_CLASSES_VIEW]: "Permite acceder a la vista de mis clases.",
    [AuthorityKey.TEACHER_SCHEDULE_VIEW]: "Permite acceder a la vista de mi horario docente.",

    [AuthorityKey.COLLECTION_CREATE]: "Permite iniciar una nueva cobranza escolar.",
    [AuthorityKey.PAYMENTS_VIEW]: "Permite ver el listado de pagos y cobros registrados.",
    [AuthorityKey.INVOICES_VIEW]: "Permite acceder al modulo de facturas.",
    [AuthorityKey.TUITION_VIEW]: "Permite acceder al modulo de pendientes de cobro.",
    [AuthorityKey.DISCOUNTS_VIEW]: "Permite acceder al modulo de descuentos.",

    [AuthorityKey.ENROLLMENTS_VIEW]: "Permite ver el listado de inscripciones.",
    [AuthorityKey.ENROLLMENT_CREATE]: "Permite registrar nuevas inscripciones.",

    [AuthorityKey.USERS_VIEW]: "Permite ver el listado de usuarios.",
    [AuthorityKey.USER_DETAILS_VIEW]: "Permite acceder a los detalles de un usuario.",
    [AuthorityKey.USER_EDIT]: "Permite editar la informacion de un usuario.",
    [AuthorityKey.USER_STATUS_UPDATE]: "Permite cambiar el estado de un usuario.",

    [AuthorityKey.USER_INVITATIONS_VIEW]: "Permite ver el listado de invitaciones de usuarios.",
    [AuthorityKey.USER_INVITATION_CREATE]: "Permite enviar nuevas invitaciones de usuario.",

    [AuthorityKey.ROLES_VIEW]: "Permite ver el listado de roles.",
    [AuthorityKey.ROLE_CREATE]: "Permite crear nuevos roles.",
    [AuthorityKey.ROLE_DETAILS_VIEW]: "Permite acceder a los detalles de un rol.",
    [AuthorityKey.ROLE_ASSIGN_AUTHORITIES]: "Permite asignar o desasignar permisos a un rol.",

    [AuthorityKey.AUTHORITIES_VIEW]: "Permite ver el listado de permisos del sistema.",
    [AuthorityKey.AUTHORITY_CREATE]: "Permite crear nuevos permisos del sistema.",

    [AuthorityKey.GUARDIANS_VIEW]: "Permite ver el listado de padres o tutores.",
    [AuthorityKey.GUARDIAN_CREATE]: "Permite registrar nuevos padres o tutores.",
    [AuthorityKey.GUARDIAN_DETAILS_VIEW]: "Permite acceder a los detalles de un padre o tutor.",

    [AuthorityKey.TEACHERS_VIEW]: "Permite acceder al modulo de profesores.",

    [AuthorityKey.COURSE_TEMPLATES_VIEW]: "Permite ver el listado de plantillas de cursos.",
    [AuthorityKey.COURSE_TEMPLATE_CREATE]: "Permite crear nuevas plantillas de cursos.",
    [AuthorityKey.COURSE_TEMPLATE_EDIT]: "Permite editar plantillas de cursos existentes.",
    [AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW]: "Permite acceder a los detalles de una plantilla de curso.",

    [AuthorityKey.PRICE_TEMPLATES_VIEW]: "Permite acceder al listado de plantillas de precios.",
    [AuthorityKey.MATERIAL_TEMPLATES_VIEW]: "Permite acceder al listado de plantillas de materiales.",

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
