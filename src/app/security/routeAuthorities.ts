import {AuthorityKey} from "../../domain/model/user/authorities.ts";

type RouteAuthorityRule = {
    pattern: RegExp;
    authority: AuthorityKey;
};

const routeAuthorityRules: RouteAuthorityRule[] = [
    {pattern: /^\/home\/?$/, authority: AuthorityKey.DASHBOARD_VIEW},

    {pattern: /^\/students(\/list)?$/, authority: AuthorityKey.STUDENTS_VIEW},

    {pattern: /^\/courses\/templates\/prices$/, authority: AuthorityKey.PRICE_TEMPLATES_VIEW},
    {pattern: /^\/courses\/templates\/materials$/, authority: AuthorityKey.MATERIAL_TEMPLATES_VIEW},
    {pattern: /^\/courses\/templates\/\d+$/, authority: AuthorityKey.COURSE_TEMPLATE_DETAILS_VIEW},
    {pattern: /^\/courses\/templates$/, authority: AuthorityKey.COURSE_TEMPLATES_VIEW},

    {pattern: /^\/courses\/\d+$/, authority: AuthorityKey.COURSE_DETAILS_VIEW},
    {pattern: /^\/courses(\/list)?$/, authority: AuthorityKey.COURSES_VIEW},

    {pattern: /^\/teacher\/schedule$/, authority: AuthorityKey.TEACHER_SCHEDULE_VIEW},

    {pattern: /^\/subjects(\/list)?$/, authority: AuthorityKey.SUBJECTS_VIEW},

    {pattern: /^\/specializations\/\d+$/, authority: AuthorityKey.SPECIALIZATION_DETAILS_VIEW},
    {pattern: /^\/specializations(\/list)?$/, authority: AuthorityKey.SPECIALIZATIONS_VIEW},

    {pattern: /^\/guardians\/\d+$/, authority: AuthorityKey.GUARDIAN_DETAILS_VIEW},
    {pattern: /^\/guardians(\/list)?$/, authority: AuthorityKey.GUARDIANS_VIEW},

    {pattern: /^\/payments(\/list)?$/, authority: AuthorityKey.PAYMENTS_VIEW},
    {pattern: /^\/enrollments(\/list)?$/, authority: AuthorityKey.ENROLLMENTS_VIEW},

    {pattern: /^\/users\/roles\/\d+$/, authority: AuthorityKey.ROLE_DETAILS_VIEW},
    {pattern: /^\/users\/roles$/, authority: AuthorityKey.ROLES_VIEW},
    {pattern: /^\/users\/authorities$/, authority: AuthorityKey.AUTHORITIES_VIEW},
    {pattern: /^\/users\/invitations$/, authority: AuthorityKey.USER_INVITATIONS_VIEW},
    {pattern: /^\/users\/\d+$/, authority: AuthorityKey.USER_DETAILS_VIEW},
    {pattern: /^\/users$/, authority: AuthorityKey.USERS_VIEW},

    {pattern: /^\/help$/, authority: AuthorityKey.HELP_VIEW},
];

export const resolveRouteAuthority = (pathname: string): AuthorityKey | undefined => {
    const match = routeAuthorityRules.find((rule) => rule.pattern.test(pathname));
    return match?.authority;
};
