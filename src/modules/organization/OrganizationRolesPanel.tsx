import {useEffect, useState} from "react";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {OrganizationRoleForm} from "./OrganizationRoleForm.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {AuthoritiesModal} from "../user/role/AuthoritiesModal.tsx";
import {RoleService} from "../../services/user/RoleService.ts";
import {UserRole} from "../../domain/model/user/user.ts";

type OrganizationRole = {id: number; name: string; description?: string};

export const OrganizationRolesPanel = ({organizationId}: {organizationId: number}) => {
    const {hasAuthority} = useAuthContext();
    const [roles, setRoles] = useState<OrganizationRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [showAuthorities, setShowAuthorities] = useState(false);

    useEffect(() => {
        setLoading(true);
        OrganizationAdminService.instance.roles(organizationId)
            .then((page) => setRoles(page.content))
            .finally(() => setLoading(false));
    }, [organizationId]);

    const refresh = () => { setShowCreate(false); setLoading(true); OrganizationAdminService.instance.roles(organizationId).then((page) => setRoles(page.content)).finally(() => setLoading(false)); };
    const openAuthorities = async (roleId: number) => {
        try {
            setSelectedRole(await RoleService.instance.getOne(roleId));
            setShowAuthorities(true);
        } catch {
            // The common role detail endpoint already provides a useful server error when unavailable.
        }
    };
    const assignedAuthorities = selectedRole?.authorities?.map((item) => item.authority?.id).filter((id): id is number => Boolean(id)) ?? [];
    return <><div className="surface-card-header"><div><h3 className="text-base font-semibold">Roles</h3><p className="text-sm" style={{color: "var(--text-secondary)"}}>Roles disponibles para esta organización.</p></div>{hasAuthority(AuthorityKey.ROLE_CREATE) && <button className="btn btn-sm btn-primary" type="button" onClick={() => setShowCreate(true)}><i className="fa fa-plus me-1"/>Nuevo rol</button>}</div><div className="data-table-card-body"><table className="table-shell"><thead><tr><th>Rol</th><th>Descripción</th><th/></tr></thead><tbody>{loading && <tr><td colSpan={3} className="p-5 text-sm">Cargando roles...</td></tr>}{!loading && roles.length === 0 && <tr><td colSpan={3}><EmptyState title="No hay roles para esta organización" description="Crea un rol para comenzar." icon="fa-user-shield"/></td></tr>}{roles.map((role) => <tr key={role.id}><td><strong>{role.name}</strong></td><td>{role.description || "Sin descripción"}</td><td className="text-right">{hasAuthority(AuthorityKey.ROLE_ASSIGN_AUTHORITIES) && <button type="button" className="icon-button h-9 w-9" title="Asignar permisos" onClick={() => void openAuthorities(role.id)}><i className="fa fa-sliders"/></button>}</td></tr>)}</tbody></table></div><LeftModal title="Nuevo rol" isOpen={showCreate} onClose={() => setShowCreate(false)} className="w-[400px] h-full z-[9999]"><OrganizationRoleForm organizationId={organizationId} onSaved={refresh}/></LeftModal>{selectedRole && <AuthoritiesModal open={showAuthorities} onClose={() => setShowAuthorities(false)} roleName={selectedRole.name} roleId={selectedRole.id} initialAuthorities={assignedAuthorities} onSaved={refresh}/>}</>;
};
