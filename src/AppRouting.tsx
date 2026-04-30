import {Navigate, Route, Routes} from "react-router-dom";
import {AuthPage} from "./modules/auth/AuthPage";
import {HomeRouting} from "./modules/home/HomeRouting";
import {Error500} from "./modules/errors/components/Error500.tsx";
import {ErrorsLayout} from "./modules/errors/ErrorsLayout.tsx";
import {Error404} from "./modules/errors/components/Error404.tsx";
import {Error403} from "./modules/errors/components/Error403.tsx";
import {MainLayout} from "./modules/shared/main/MainLayout.tsx";
import {StudentRouting} from "./modules/student/StudentRouting.tsx";
import {EnrollmentRouting} from "./modules/student/enrollment/EnrollmentRouting.tsx";
import {PaymentRouting} from "./modules/payment/PaymentRouting.tsx";
import {SpecializationRouting} from "./modules/specialization/SpecializationRouting.tsx";
import {UserListPage} from "./modules/user/UserListPage.tsx";
import {UserOptionsPage} from "./modules/user/tabs/UserOptionsPage.tsx";
import {RoleListPage} from "./modules/user/role/RoleListPage.tsx";
import {AuthorityListPage} from "./modules/user/authority/AuthorityListPage.tsx";
import {ListCourseTemplatePage} from "./modules/course/template/ListCourseTemplatePage.tsx";
import {ListPriceTemplatePage} from "./modules/course/template/ListPriceTemplatePage.tsx";
import {ListMaterialTemplatePage} from "./modules/course/template/ListMaterialTemplatePage.tsx";
import {OrganizationOptionsPage} from "./modules/organization/OrganizationOptionsPage.tsx";
import {SpecializationForm} from "./modules/specialization/create/SpecializationForm.tsx";
import {UserInvitationListPage} from "./modules/user/invitation/UserInvitationListPage.tsx";

export const AppRouting = () => {
    return (
        <Routes>
            <Route path="/" element={<MainLayout/>}>
                <Route path="/*" element={<HomeRouting/>}/>
                <Route path="/" element={<Navigate to="/home" replace/>}/>
                <Route path="students/*" element={<StudentRouting/>}/>
                <Route path="enrollments/*" element={<EnrollmentRouting/>}/>
                <Route path="payments/*" element={<PaymentRouting/>}/>
                <Route path="specializations/*" element={<SpecializationRouting/>}/>
                <Route path="specializations/create" element={<SpecializationForm/>}/>
                <Route path="/users" element={<UserOptionsPage/>}>
                    <Route index element={<UserListPage/>}/>
                    <Route path="roles" element={<RoleListPage/>}/>
                    <Route path="authorities" element={<AuthorityListPage/>}/>
                    <Route path="invitations" element={<UserInvitationListPage/>}/>
                </Route>
                <Route path="/courses/templates" element={<OrganizationOptionsPage/>}>
                    <Route index element={<ListCourseTemplatePage/>}/>
                    <Route path="prices" element={<ListPriceTemplatePage/>}/>
                    <Route path="materials" element={<ListMaterialTemplatePage/>}/>
                </Route>
            </Route>

            <Route path="/auth/*" element={<AuthPage/>}/>

            <Route path="/errors" element={<ErrorsLayout/>}>
                <Route index element={<Error404/>}/>
                <Route path="403" element={<Error403/>}/>
                <Route path="404" element={<Error404/>}/>
                <Route path="500" element={<Error500/>}/>
            </Route>

            <Route path="*" element={<Navigate to="/errors/404" replace/>}/>
        </Routes>
    );
}
