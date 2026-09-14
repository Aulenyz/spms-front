import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {OrganizationUser} from "../../domain/model/organization/Organization.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {OrganizationInvitationForm} from "./OrganizationInvitationForm.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

export const OrganizationUsersPanel = ({organizationId}: {organizationId: number}) => {
    const {hasAuthority} = useAuthContext();
    const [page, setPage] = useState(Pagination.first);
    const [users, setUsers] = useState<Page<OrganizationUser>>(Pagination.empty<OrganizationUser>());
    const [showInvite, setShowInvite] = useState(false);
    const load = () => OrganizationAdminService.instance.users(organizationId, page).then(setUsers).catch((error: any) => {
        toast.error(error?.message ?? "No se pudieron cargar los usuarios de la organización.");
    });
    useEffect(() => {
        void load();
    }, [organizationId, page]);
    return <><div className="surface-card-header"><div><h3 className="text-base font-semibold">Usuarios</h3><p className="text-sm" style={{color: "var(--text-secondary)"}}>Usuarios asociados a esta organización.</p></div>{hasAuthority(AuthorityKey.USER_INVITATION_CREATE) && <button className="btn btn-sm btn-primary" type="button" onClick={() => setShowInvite(true)}><i className="fa fa-paper-plane me-1"/>Invitar usuario</button>}</div><div className="data-table-card-body"><table className="table-shell"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{users.content.length === 0 && <tr><td colSpan={4}><EmptyState title="No hay usuarios en esta organización" description="Envía una invitación para agregar el primero." icon="fa-users"/></td></tr>}{users.content.map((user) => <tr key={user.id}><td><div className="flex items-center gap-2"><img src={user.image || "/default-avatar.png"} className="h-8 w-8 rounded-full object-cover" alt=""/><strong>{user.name || user.username}</strong></div></td><td>{user.email}</td><td>{user.role?.name ?? "-"}</td><td>{user.status === "ACTIVE" ? "Activo" : user.status === "INACTIVE" ? "Inactivo" : "Cancelado"}</td></tr>)}</tbody></table><Pager onChange={(next) => setPage((current) => ({...current, page: next}))} onPageSizeChange={(size) => setPage((current) => ({...current, page: 0, size}))} page={users}/></div><LeftModal title="Invitar usuario" isOpen={showInvite} onClose={() => setShowInvite(false)} className="w-[400px] h-full z-[9999]"><OrganizationInvitationForm organizationId={organizationId} onSaved={() => { setShowInvite(false); void load(); }}/></LeftModal></>;
};
