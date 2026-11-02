import {useEffect, useMemo, useState} from "react";
import {Link, useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {Genders, User, UserStatus, UserStatusLabel} from "../../../domain/model/user/user.ts";
import {UserService} from "../../../services/user/UserService.ts";
import {RoleService} from "../../../services/user/RoleService.ts";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {DetailHeader} from "../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {InfoList} from "../../../components/ui/detail/InfoList.tsx";
import {Badge, StatusBadge} from "../../../components/ui/detail/StatusBadge.tsx";
import {OptionsMenu} from "../../../components/ui/OptionsMenu.tsx";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {CHANNEL_ICON, useUserChannels} from "./useUserChannels.ts";

const STATUS_ACTIONS: Record<UserStatus, { label: string; icon: string }> = {
    [UserStatus.ACTIVE]: {label: "Activar usuario", icon: "fa-circle-check"},
    [UserStatus.INACTIVE]: {label: "Inactivar usuario", icon: "fa-circle-pause"},
    [UserStatus.CANCELLED]: {label: "Cancelar usuario", icon: "fa-ban"},
};

/** Lo que pasa al inactivar o cancelar, para confirmarlo antes. */
const STATUS_CONFIRM: Partial<Record<UserStatus, string>> = {
    [UserStatus.INACTIVE]: "No podrá entrar al panel ni a las aplicaciones hasta que lo actives de nuevo.",
    [UserStatus.CANCELLED]: "El usuario queda cancelado y pierde el acceso al panel y a las aplicaciones.",
};

type TabKey = "info";
const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
    {key: "info", label: "Datos del usuario", icon: "fa-id-card"},
];

const userService = UserService.instance;
const roleService = RoleService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

export const UserDetailsPage = () => {
    const {hasAuthority} = useAuthContext();
    const {id} = useParams<{id: string}>();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleDetails, setRoleDetails] = useState<User["role"] | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [confirmStatus, setConfirmStatus] = useState<UserStatus | null>(null);
    const apps = useUserChannels(user?.id);
    const [tab, setTab] = useState<TabKey>(() => {
        const saved = id ? localStorage.getItem(`user-details-tab-${id}`) : null;
        return TABS.some((item) => item.key === saved) ? saved as TabKey : "info";
    });

    useEffect(() => {
        if (id) localStorage.setItem(`user-details-tab-${id}`, tab);
    }, [id, tab]);

    const name = useMemo(() => {
        if (!user) return "Usuario";
        const first = (user.info?.firstname ?? "").toString().trim();
        const last = (user.info?.lastname ?? "").toString().trim();
        return `${first} ${last}`.trim() || user.username || "Usuario";
    }, [user]);

    const refresh = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await userService.getOne(id);
            setUser(response ?? null);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del usuario.");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, [id]);

    useEffect(() => {
        if (!user?.role?.id) return;
        setRoleLoading(true);
        roleService
            .getOne(user.role.id)
            .then((res) => setRoleDetails(res ?? null))
            .catch(() => setRoleDetails(null))
            .finally(() => setRoleLoading(false));
    }, [user?.role?.id]);

    const changeStatus = (status: UserStatus) => {
        if (!user?.id) return;
        setUpdatingStatus(true);
        userService
            .updateStatus(user.id, status)
            .then(() => {
                toast.success("Estado actualizado.");
                setConfirmStatus(null);
                void refresh();
            })
            .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el estado."))
            .finally(() => setUpdatingStatus(false));
    };

    if (loading && !user) return <LoadingContent loading className="py-16"/>;
    if (!user) return <EmptyState title="No se encontró el usuario"
                                  description="Vuelve al listado e intenta nuevamente." icon="fa-user"/>;

    const canChangeStatus = hasAuthority(AuthorityKey.USER_STATUS_UPDATE);
    const canViewRole = hasAuthority(AuthorityKey.ROLE_DETAILS_VIEW);
    const canEditUser = hasAuthority(AuthorityKey.USER_EDIT);
    const permissionCount = roleDetails?.countAuthorities ?? user.role?.countAuthorities;

    return (
        <div className="space-y-4">
            <DetailHeader
                image={user.info?.image}
                avatar={name}
                title={name}
                subtitle={user.username ? `@${user.username}` : undefined}
                badges={user.status === UserStatus.CANCELLED
                    ? <Badge>{UserStatusLabel.CANCELLED}</Badge>
                    : <StatusBadge active={user.status === UserStatus.ACTIVE}/>}
                actions={<OptionsMenu label={`Opciones de ${name}`} items={[
                    ...([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.CANCELLED] as const).map((status) => ({
                        ...STATUS_ACTIONS[status],
                        visible: canChangeStatus && status !== user.status,
                        onSelect: () => STATUS_CONFIRM[status] ? setConfirmStatus(status) : changeStatus(status),
                    })),
                    ...apps.channels.map((channel) => ({
                        label: channel.granted ? `Quitar acceso a ${channel.name}` : `Habilitar ${channel.name}`,
                        icon: channel.granted ? "fa-lock" : CHANNEL_ICON[channel.key] ?? "fa-unlock",
                        visible: canEditUser && (channel.granted || channel.eligible),
                        onSelect: () => apps.toggle(channel, !channel.granted),
                    })),
                ]}/>}
            />

            <nav className="section-tabs w-fit">
                {TABS.map((item) => (
                    <button key={item.key} type="button" onClick={() => setTab(item.key)}
                            className={clsx("section-tab", tab === item.key && "section-tab-active")}>
                        <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {tab === "info" && <>
                <DetailSection title="Datos del usuario">
                    <InfoList items={[
                        {label: "Correo", value: user.email},
                        {label: "Documento", value: user.document},
                        {label: "Género", value: user.info?.gender ? Genders[user.info.gender] : undefined},
                    ]}/>
                </DetailSection>

                <DetailSection title="Rol"
                               actions={canViewRole && user.role?.id && <Link to={`/users/roles/${user.role.id}`} className="btn btn-sm">
                                   <i className="fa fa-arrow-up-right-from-square"/>Ver rol
                               </Link>}>
                    <InfoList items={[
                        {label: "Rol asignado", value: user.role?.name},
                        {label: "Permisos", value: roleLoading ? "Cargando..." : permissionCount},
                        {label: "Descripción", value: roleLoading ? "Cargando..." : roleDetails?.description, full: true},
                    ]}/>
                </DetailSection>
            </>}

            <CenterModal title={confirmStatus ? STATUS_ACTIONS[confirmStatus].label : ""} isOpen={confirmStatus !== null}
                         onClose={() => !updatingStatus && setConfirmStatus(null)} className="max-w-md">
                <div className="space-y-5">
                    <p className="text-sm" style={{color: "var(--text-secondary)"}}>
                        {confirmStatus && STATUS_CONFIRM[confirmStatus]} ¿Seguro que quieres continuar con {name}?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-sm" disabled={updatingStatus} onClick={() => setConfirmStatus(null)}>Volver</button>
                        <button type="button" className="btn btn-sm btn-error" disabled={updatingStatus}
                                onClick={() => confirmStatus && changeStatus(confirmStatus)}>
                            <i className={updatingStatus ? "fa fa-spinner fa-spin" : `fa ${confirmStatus ? STATUS_ACTIONS[confirmStatus].icon : ""}`}/>
                            {confirmStatus ? STATUS_ACTIONS[confirmStatus].label : ""}
                        </button>
                    </div>
                </div>
            </CenterModal>
        </div>
    );
};
