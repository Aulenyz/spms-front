import {useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {toast} from "react-toastify";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {OrganizationInvitation} from "../../domain/model/organization/Organization.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {UserInvitationService} from "../../services/user/UserInvitationService.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

const EMPTY_PAGE: Page<OrganizationInvitation> = Pagination.empty<OrganizationInvitation>();

export const OrganizationInvitationsPanel = ({organizationId}: {organizationId: number}) => {
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [resending, setResending] = useState<number | null>(null);
    const invitationsKey = [...queryKeys.organizations.all, organizationId, "invitations"];
    const {data: invitations = EMPTY_PAGE} = useQuery({
        queryKey: invitationsKey,
        queryFn: ({signal}) => OrganizationAdminService.instance.withSignal(signal).invitations(organizationId, Pagination.ofSize(100)),
        meta: {errorMessage: "No se pudieron cargar las invitaciones."},
    });
    const load = () => queryClient.invalidateQueries({queryKey: invitationsKey});
    return <div>
        <div className="surface-card-header"><div><h3 className="text-base font-semibold">Usuarios invitados</h3><p className="text-sm" style={{color: "var(--text-secondary)"}}>Invitaciones pendientes para unirse a esta organización.</p></div><span className="rounded-full px-3 py-1 text-xs font-semibold" style={{background: "var(--muted)", color: "var(--text-secondary)"}}>{invitations.content.length} pendientes</span></div>
        <div className="data-table-card-body"><table className="table-shell"><thead><tr><th>Correo</th><th>Rol</th><th>Estado</th><th/></tr></thead><tbody>{invitations.content.length === 0 && <tr><td colSpan={4}><EmptyState title="No hay usuarios invitados" description="Las invitaciones pendientes de esta organización aparecerán aquí." icon="fa-paper-plane"/></td></tr>}{invitations.content.map((invitation) => <tr key={invitation.id}><td><strong>{invitation.email}</strong></td><td>{invitation.role?.name ?? "-"}</td><td><span className="text-sm font-semibold text-[var(--text-secondary)]"><i className="fa fa-clock-o me-1"/>Pendiente</span></td><td className="text-right">{hasAuthority(AuthorityKey.USER_INVITATION_CREATE) && <button type="button" className="icon-button h-9 w-9" title="Reenviar invitación" disabled={resending === invitation.id} onClick={() => { setResending(invitation.id!); UserInvitationService.instance.resend(invitation.id!).then(() => { toast.success("Invitación reenviada."); void load(); }).catch((error: any) => toast.error(error?.message ?? "No se pudo reenviar la invitación.")).finally(() => setResending(null)); }}><i className={`fa ${resending === invitation.id ? "fa-spinner fa-spin" : "fa-repeat"}`}/></button>}</td></tr>)}</tbody></table></div>
    </div>;
};
