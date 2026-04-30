import {Outlet, useLocation} from "react-router-dom";
import {PageHeader} from "../../../components/ui/layout/PageHeader.tsx";
import {SectionTabs} from "../../../components/ui/layout/SectionTabs.tsx";

export const UserOptionsPage = () => {
    const location = useLocation();

    const isUsers = location.pathname === "/users";
    const isRoles = location.pathname === "/users/roles";
    const isAuthorities = location.pathname === "/users/authorities";
    const isInvitations = location.pathname === "/users/invitations";

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Gobernanza y acceso"
                title="Administracion de usuarios"
                description="Gestiona cuentas, invitaciones, roles y permisos desde pantallas separadas y ordenadas."
            />
            <SectionTabs tabs={[
                {to: "/users", label: "Usuarios", icon: "fa-users", active: isUsers},
                {to: "/users/invitations", label: "Invitaciones", icon: "fa-paper-plane", active: isInvitations},
                {to: "/users/roles", label: "Roles", icon: "fa-user-shield", active: isRoles},
                {to: "/users/authorities", label: "Permisos", icon: "fa-sliders", active: isAuthorities},
            ]}/>
            <Outlet/>
        </div>
    );
};
