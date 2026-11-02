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
import {UserChannelsSection} from "./UserChannelsSection.tsx";

const STATUS_ACTIONS: Record<UserStatus, { label: string; icon: string }> = {
    [UserStatus.ACTIVE]: {label: "Activar", icon: "fa-circle-check"},
    [UserStatus.INACTIVE]: {label: "Inactivar", icon: "fa-circle-pause"},
    [UserStatus.CANCELLED]: {label: "Cancelar usuario", icon: "fa-ban"},
};

type TabKey = "info" | "role" | "apps";
const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
    {key: "info", label: "Datos del usuario", icon: "fa-id-card"},
    {key: "role", label: "Rol y permisos", icon: "fa-user-shield"},
    {key: "apps", label: "Aplicaciones", icon: "fa-mobile-screen"},
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
    const tabs = TABS.filter((item) => item.key !== "apps" || (canEditUser && user.id));
    const current = tabs.some((item) => item.key === tab) ? tab : "info";

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
                actions={<>
                    {canChangeStatus && ([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.CANCELLED] as const)
                        .filter((status) => status !== user.status)
                        .map((status) => (
                            <button key={status} type="button" className="btn btn-sm" disabled={updatingStatus}
                                    onClick={() => changeStatus(status)}>
                                <i className={`fa ${STATUS_ACTIONS[status].icon}`}/>{STATUS_ACTIONS[status].label}
                            </button>
                        ))}
                </>}
            />

            <nav className="section-tabs w-fit">
                {tabs.map((item) => (
                    <button key={item.key} type="button" onClick={() => setTab(item.key)}
                            className={clsx("section-tab", current === item.key && "section-tab-active")}>
                        <i className={`fa ${item.icon}`}/><span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {current === "info" && <DetailSection title="Datos del usuario">
                <InfoList items={[
                    {label: "Correo", value: user.email},
                    {label: "Documento", value: user.document},
                    {label: "Género", value: user.info?.gender ? Genders[user.info.gender] : undefined},
                ]}/>
            </DetailSection>}

            {current === "role" && <DetailSection title="Rol"
                           actions={canViewRole && user.role?.id && <Link to={`/users/roles/${user.role.id}`} className="btn btn-sm">
                               <i className="fa fa-arrow-up-right-from-square"/>Ver rol
                           </Link>}>
                <InfoList items={[
                    {label: "Rol asignado", value: user.role?.name},
                    {label: "Permisos", value: roleLoading ? "Cargando..." : permissionCount},
                    {label: "Descripción", value: roleLoading ? "Cargando..." : roleDetails?.description, full: true},
                ]}/>
            </DetailSection>}

            {current === "apps" && user.id && <UserChannelsSection userId={user.id}/>}
        </div>
    );
};
