import {Suspense} from "react";
import {Navigate, Route, Routes, useLocation} from "react-router-dom";
import {lazyPage} from "./app/routing/lazyPage.ts";
import {RouteErrorBoundary} from "./app/routing/RouteErrorBoundary.tsx";
import {LoadingPage} from "./components/io/output/LoadingPage.tsx";
import {ErrorsLayout} from "./modules/errors/ErrorsLayout.tsx";

// Cada pantalla se descarga bajo demanda (code splitting por ruta).
const MainLayout = lazyPage(() => import("./modules/shared/main/MainLayout.tsx"), "MainLayout");
const AuthPage = lazyPage(() => import("./modules/auth/AuthPage"), "AuthPage");
const HomeRouting = lazyPage(() => import("./modules/home/HomeRouting"), "HomeRouting");
const Error500 = lazyPage(() => import("./modules/errors/components/Error500.tsx"), "Error500");
const Error404 = lazyPage(() => import("./modules/errors/components/Error404.tsx"), "Error404");
const Error403 = lazyPage(() => import("./modules/errors/components/Error403.tsx"), "Error403");
const Error503 = lazyPage(() => import("./modules/errors/components/Error503.tsx"), "Error503");
const StudentRouting = lazyPage(() => import("./modules/student/StudentRouting.tsx"), "StudentRouting");
const EnrollmentRouting = lazyPage(() => import("./modules/student/enrollment/EnrollmentRouting.tsx"), "EnrollmentRouting");
const PaymentRouting = lazyPage(() => import("./modules/payment/PaymentRouting.tsx"), "PaymentRouting");
const SpecializationRouting = lazyPage(() => import("./modules/specialization/SpecializationRouting.tsx"), "SpecializationRouting");
const UserListPage = lazyPage(() => import("./modules/user/UserListPage.tsx"), "UserListPage");
const UserOptionsPage = lazyPage(() => import("./modules/user/tabs/UserOptionsPage.tsx"), "UserOptionsPage");
const RoleListPage = lazyPage(() => import("./modules/user/role/RoleListPage.tsx"), "RoleListPage");
const AuthorityListPage = lazyPage(() => import("./modules/user/authority/AuthorityListPage.tsx"), "AuthorityListPage");
const ListCourseTemplatePage = lazyPage(() => import("./modules/course/template/ListCourseTemplatePage.tsx"), "ListCourseTemplatePage");
const ListPriceTemplatePage = lazyPage(() => import("./modules/course/template/ListPriceTemplatePage.tsx"), "ListPriceTemplatePage");
const ListMaterialTemplatePage = lazyPage(() => import("./modules/course/template/ListMaterialTemplatePage.tsx"), "ListMaterialTemplatePage");
const CourseTemplateDetailsPage = lazyPage(() => import("./modules/course/template/CourseTemplateDetailsPage.tsx"), "CourseTemplateDetailsPage");
const SpecializationForm = lazyPage(() => import("./modules/specialization/create/SpecializationForm.tsx"), "SpecializationForm");
const UserInvitationListPage = lazyPage(() => import("./modules/user/invitation/UserInvitationListPage.tsx"), "UserInvitationListPage");
const UserDetailsPage = lazyPage(() => import("./modules/user/details/UserDetailsPage.tsx"), "UserDetailsPage");
const RoleDetailsPage = lazyPage(() => import("./modules/user/role/details/RoleDetailsPage.tsx"), "RoleDetailsPage");
const CourseRouting = lazyPage(() => import("./modules/course/CourseRouting.tsx"), "CourseRouting");
const GuardianRouting = lazyPage(() => import("./modules/guardian/GuardianRouting.tsx"), "GuardianRouting");
const SubjectRouting = lazyPage(() => import("./modules/subject/SubjectRouting.tsx"), "SubjectRouting");
const HelpCenterPage = lazyPage(() => import("./modules/help/HelpCenterPage.tsx"), "HelpCenterPage");
const CatalogRouting = lazyPage(() => import("./modules/catalog/CatalogRouting.tsx"), "CatalogRouting");
const TeacherRouting = lazyPage(() => import("./modules/teacher/TeacherRouting.tsx"), "TeacherRouting");
const OrganizationListPage = lazyPage(() => import("./modules/organization/OrganizationListPage.tsx"), "OrganizationListPage");
const OrganizationDetailsPage = lazyPage(() => import("./modules/organization/OrganizationDetailsPage.tsx"), "OrganizationDetailsPage");

export const AppRouting = () => {
    const {pathname} = useLocation();
    return (
        <RouteErrorBoundary resetKey={pathname}>
        <Suspense fallback={<LoadingPage/>}>
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route path="home/*" element={<HomeRouting/>}/>
                <Route path="students/*" element={<StudentRouting/>}/>
                <Route path="enrollments/*" element={<EnrollmentRouting/>}/>
                <Route path="payments/*" element={<PaymentRouting/>}/>
                <Route path="courses/*" element={<CourseRouting/>}/>
                <Route path="teacher/*" element={<TeacherRouting/>}/>
                <Route path="subjects/*" element={<SubjectRouting/>}/>
                <Route path="help" element={<HelpCenterPage/>}/>
                <Route path="catalog/*" element={<CatalogRouting/>}/>
                <Route path="guardians/*" element={<GuardianRouting/>}/>
                <Route path="specializations/*" element={<SpecializationRouting/>}/>
                <Route path="specializations/create" element={<SpecializationForm/>}/>
                <Route path="/users" element={<UserOptionsPage/>}>
                    <Route index element={<UserListPage/>}/>
                    <Route path="roles" element={<RoleListPage/>}/>
                    <Route path="authorities" element={<AuthorityListPage/>}/>
                    <Route path="invitations" element={<UserInvitationListPage/>}/>
                </Route>
                <Route path="/users/:id" element={<UserDetailsPage/>}/>
                <Route path="/users/roles/:id" element={<RoleDetailsPage/>}/>
                <Route path="/organizations" element={<OrganizationListPage/>}/>
                <Route path="/organizations/:id" element={<OrganizationDetailsPage/>}/>

                {/* Full details screen (outside templates tabs) */}
                <Route path="/courses/templates/:id" element={<CourseTemplateDetailsPage/>}/>

                {/* Templates as separate screens (no tabs). */}
                <Route path="/courses/templates" element={<ListCourseTemplatePage/>}/>
                <Route path="/courses/templates/prices" element={<ListPriceTemplatePage/>}/>
                <Route path="/courses/templates/materials" element={<ListMaterialTemplatePage/>}/>
            </Route>

            <Route path="/auth/*" element={<AuthPage/>}/>

            <Route path="/errors" element={<ErrorsLayout/>}>
                <Route index element={<Error404/>}/>
                <Route path="403" element={<Error403/>}/>
                <Route path="404" element={<Error404/>}/>
                <Route path="500" element={<Error500/>}/>
                <Route path="503" element={<Error503/>}/>
            </Route>

            <Route path="*" element={<Navigate to="/errors/404" replace/>}/>
        </Routes>
        </Suspense>
        </RouteErrorBoundary>
    );
}
