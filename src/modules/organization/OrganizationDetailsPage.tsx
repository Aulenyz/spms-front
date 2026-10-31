import {useEffect, useMemo, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {Organization} from "../../domain/model/organization/Organization.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {RightModal} from "../../components/shared/RightModal.tsx";
import {OrganizationForm} from "./OrganizationForm.tsx";
import {OrganizationUsersPanel} from "./OrganizationUsersPanel.tsx";
import {OrganizationRolesPanel} from "./OrganizationRolesPanel.tsx";
import {OrganizationInvitationsPanel} from "./OrganizationInvitationsPanel.tsx";

const service = OrganizationAdminService.instance;
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

export const OrganizationDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [showEdit, setShowEdit] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [section, setSection] = useState<"users" | "invitations" | "roles">("users");
    const menuRef = useRef<HTMLDivElement | null>(null);
    const organizationQuery = useQuery({
        queryKey: [...queryKeys.organizations.all, "detail", id],
        queryFn: ({signal}) => service.withSignal(signal).getOne(id) as Promise<Organization>,
        enabled: Boolean(id),
        meta: {errorMessage: "No se pudo cargar la organización."},
    });
    const organization: Organization | null = organizationQuery.data ?? null;
    const loading: boolean = organizationQuery.isPending;
    // Refresca el detalle y los listados de organizaciones.
    const refresh = () => queryClient.invalidateQueries({queryKey: queryKeys.organizations.all});
    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);
    const name = useMemo(() => organization?.name?.trim() || "Organización", [organization]);
    const changeStatus = async () => {
        if (!organization?.id || updatingStatus) return;
        setUpdatingStatus(true);
        try {
            await service.updateStatus(organization.id);
            toast.success("Estado actualizado.");
            setShowMenu(false);
            await refresh();
        } catch (error: any) {
            toast.error(error?.message ?? "No se pudo actualizar el estado.");
        } finally {
            setUpdatingStatus(false);
        }
    };
    if (loading) return <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>Cargando
        organización...</div>;
    if (!organization) return <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>No se
        encontró la organización.</div>;
    return <div className="space-y-5">
        <div className="px-4 pb-4 pt-8 sm:px-6 sm:pb-5"
             style={{background: "radial-gradient(circle at top, rgba(15, 98, 254, 0.08), transparent 55%), radial-gradient(circle at top right, rgba(18, 128, 92, 0.06), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))"}}>
            <div className="mx-auto flex w-full max-w-[1480px] flex-col items-center text-center">
                <div className="mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border"
                     style={{
                         borderColor: "var(--border-soft)",
                         background: "var(--surface)",
                         boxShadow: "var(--shadow-card)"
                     }}>{organization.logo ?
                    <img src={organization.logo} alt={name} className="h-full w-full rounded-full object-cover"/> :
                    <span className="text-2xl font-extrabold"
                          style={{color: "var(--accent)"}}>{initials(name)}</span>}</div>
                <div className="flex flex-wrap items-center justify-center gap-2"><h2
                    className="max-w-[min(92vw,720px)] truncate text-xl font-semibold"
                    style={{color: "var(--text-primary)"}}>{name}</h2>{hasAuthority(AuthorityKey.ORGANIZATION_EDIT) &&
                    <button type="button" className="icon-button h-9 w-9" title="Editar"
                            onClick={() => setShowEdit(true)}><i className="fa fa-pen"/>
                    </button>}{hasAuthority(AuthorityKey.ORGANIZATION_STATUS_UPDATE) &&
                    <div className="relative" ref={menuRef}>
                        <button type="button" className="icon-button h-9 w-9" title="Opciones"
                                onClick={() => setShowMenu((value) => !value)}><i className="fa fa-gear"/></button>
                        {showMenu && <div className="floating-panel right-0 mt-2 w-72">
                            <div className="floating-panel-header">Opciones</div>
                            <div className="space-y-1 p-2">
                                <button type="button" disabled={updatingStatus} onClick={() => void changeStatus()}
                                        className="profile-menu-item w-full"><span
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl" style={{
                                    background: organization.active ? "var(--muted)" : "var(--success-soft)",
                                    color: organization.active ? "var(--text-secondary)" : "var(--success)"
                                }}><i className={`fa ${organization.active ? "fa-circle-pause" : "fa-circle-check"}`}/></span><span
                                    className="flex-1 text-left">{organization.active ? "Inactivar" : "Activar"}</span><i
                                    className="fa fa-chevron-right text-[10px] text-[var(--text-tertiary)]"/></button>
                            </div>
                        </div>}</div>}</div>
                <div className="mt-3 grid w-full max-w-[920px] grid-cols-1 gap-2 text-sm sm:grid-cols-3"
                     style={{color: "var(--text-secondary)"}}>
                    <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}><i
                        className="fa fa-building" style={{color: "var(--text-tertiary)"}}/><span
                        className="min-w-0 truncate">{name}</span></div>
                    <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}><i
                        className="fa fa-id-card" style={{color: "var(--text-tertiary)"}}/><span
                        className="min-w-0 truncate">{organization.document}</span></div>
                    <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}><i
                        className={`fa ${organization.active ? "fa-circle-check" : "fa-circle-pause"}`}
                        style={{color: "var(--text-tertiary)"}}/><span
                        className="min-w-0 truncate">{organization.active ? "Activa" : "Inactiva"}</span></div>
                </div>
            </div>
        </div>
        <div className="surface-card">
            <div className="surface-card-header">
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setSection("users")}
                            className={`section-tab ${section === "users" ? "section-tab-active" : ""}`}><i
                        className="fa fa-users"/><span>Usuarios</span><small>Gestión</small></button>
                    <button type="button" onClick={() => setSection("invitations")}
                            className={`section-tab ${section === "invitations" ? "section-tab-active" : ""}`}><i
                        className="fa fa-paper-plane"/><span>Usuarios invitados</span><small>Pendientes</small></button>
                    <button type="button" onClick={() => setSection("roles")}
                            className={`section-tab ${section === "roles" ? "section-tab-active" : ""}`}><i
                        className="fa fa-user-shield"/><span>Roles</span><small>Accesos</small></button>
                </div>
            </div>
            {section === "users" ?
                <OrganizationUsersPanel organizationId={organization.id!}/> : section === "invitations" ?
                    <OrganizationInvitationsPanel organizationId={organization.id!}/> :
                    <OrganizationRolesPanel organizationId={organization.id!}/>}</div>
        <RightModal title="Editar organización" isOpen={showEdit} onClose={() => setShowEdit(false)}
                    className="w-[420px] h-full z-[9999]"><OrganizationForm initial={organization} onSaved={() => {
            setShowEdit(false);
            void refresh();
        }}/></RightModal>
    </div>;
};
