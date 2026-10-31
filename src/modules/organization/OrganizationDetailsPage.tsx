import {useState} from "react";
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import clsx from "clsx";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {Organization} from "../../domain/model/organization/Organization.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";
import {RightModal} from "../../components/shared/RightModal.tsx";
import {LoadingContent} from "../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {DetailHeader} from "../../components/ui/detail/DetailHeader.tsx";
import {StatusBadge} from "../../components/ui/detail/StatusBadge.tsx";
import {OrganizationForm} from "./OrganizationForm.tsx";
import {OrganizationUsersPanel} from "./OrganizationUsersPanel.tsx";
import {OrganizationRolesPanel} from "./OrganizationRolesPanel.tsx";
import {OrganizationInvitationsPanel} from "./OrganizationInvitationsPanel.tsx";

const service = OrganizationAdminService.instance;

type SectionKey = "users" | "invitations" | "roles";

const SECTIONS: Array<{ key: SectionKey; label: string; icon: string }> = [
    {key: "users", label: "Usuarios", icon: "fa-users"},
    {key: "invitations", label: "Invitaciones", icon: "fa-paper-plane"},
    {key: "roles", label: "Roles", icon: "fa-user-shield"},
];

export const OrganizationDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const {hasAuthority} = useAuthContext();
    const queryClient = useQueryClient();
    const [showEdit, setShowEdit] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [section, setSection] = useState<SectionKey>("users");
    const organizationQuery = useQuery({
        queryKey: [...queryKeys.organizations.all, "detail", id],
        queryFn: ({signal}) => service.withSignal(signal).getOne(id) as Promise<Organization>,
        enabled: Boolean(id),
        meta: {errorMessage: "No se pudo cargar la organización."},
    });
    const organization: Organization | null = organizationQuery.data ?? null;
    // Refresca el detalle y los listados de organizaciones.
    const refresh = () => queryClient.invalidateQueries({queryKey: queryKeys.organizations.all});
    const canEdit = hasAuthority(AuthorityKey.ORGANIZATION_EDIT);
    const canChangeStatus = hasAuthority(AuthorityKey.ORGANIZATION_STATUS_UPDATE);

    const changeStatus = async () => {
        if (!organization?.id || updatingStatus) return;
        setUpdatingStatus(true);
        try {
            await service.updateStatus(organization.id);
            toast.success("Estado actualizado.");
            await refresh();
        } catch (error: unknown) {
            const message = (error as { message?: unknown } | null)?.message;
            toast.error(typeof message === "string" ? message : "No se pudo actualizar el estado.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (organizationQuery.isPending) return <LoadingContent loading className="py-16"/>;
    if (!organization) return <EmptyState title="No se encontró la organización"
                                          description="Vuelve al listado e intenta nuevamente." icon="fa-building"/>;

    const name = organization.name?.trim() || "Organización";

    return <div className="space-y-4">
        <DetailHeader
            image={organization.logo}
            avatar={name}
            title={name}
            subtitle={organization.document ? `Documento ${organization.document}` : undefined}
            badges={<StatusBadge active={organization.active} activeLabel="Activa" inactiveLabel="Inactiva"/>}
            actions={<>
                {canEdit && <button type="button" className="btn btn-sm" onClick={() => setShowEdit(true)}>
                    <i className="fa fa-pen"/>Editar
                </button>}
                {canChangeStatus && <button type="button" className="btn btn-sm" disabled={updatingStatus}
                                            onClick={() => void changeStatus()}>
                    <i className={updatingStatus ? "fa fa-spinner fa-spin" : `fa ${organization.active ? "fa-circle-pause" : "fa-circle-check"}`}/>
                    {organization.active ? "Inactivar" : "Activar"}
                </button>}
            </>}
        />

        <nav className="section-tabs w-fit">
            {SECTIONS.map((item) => (
                <button key={item.key} type="button" onClick={() => setSection(item.key)}
                        className={clsx("section-tab", section === item.key && "section-tab-active")}>
                    <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                </button>
            ))}
        </nav>

        <div className="surface-card">
            {section === "users" ? <OrganizationUsersPanel organizationId={organization.id!}/>
                : section === "invitations" ? <OrganizationInvitationsPanel organizationId={organization.id!}/>
                    : <OrganizationRolesPanel organizationId={organization.id!}/>}
        </div>

        <RightModal title="Editar organización" isOpen={showEdit} onClose={() => setShowEdit(false)}
                    className="w-[420px] h-full z-[9999]">
            <OrganizationForm initial={organization} onSaved={() => {
                setShowEdit(false);
                void refresh();
            }}/>
        </RightModal>
    </div>;
};
