import {useEffect, useMemo, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {User, UserStatus} from "../../../domain/model/user/user.ts";
import {UserService} from "../../../services/user/UserService.ts";
import {RoleService} from "../../../services/user/RoleService.ts";
import {UserStatusPill} from "../../../components/io/output/pill/UserStatusPill.tsx";
import {StudentGenderPill} from "../../../components/io/output/pill/StudentGenderPill.tsx";
import {RightModal} from "../../../components/shared/RightModal.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";

type TabKey = "profile" | "role" | "activity" | "settings";

const TABS: Array<{key: TabKey; label: string; icon: string; hint: string}> = [
    {key: "profile", label: "Perfil", icon: "fa-id-card", hint: "Datos"},
    {key: "role", label: "Rol", icon: "fa-user-shield", hint: "Permisos"},
    {key: "activity", label: "Actividad", icon: "fa-clock-rotate-left", hint: "Eventos"},
    {key: "settings", label: "Ajustes", icon: "fa-gear", hint: "Opciones"},
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

const getInitials = (value: string) =>
    value
        .split(" ")
        .map((word) => word.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

export const UserDetailsPage = () => {
    const {hasAuthority} = useAuthContext();
    const {id} = useParams<{id: string}>();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [tab, setTab] = useState<TabKey>("profile");
    const [roleLoading, setRoleLoading] = useState(false);
    const [roleDetails, setRoleDetails] = useState<User["role"] | null>(null);
    const [showEdit, setShowEdit] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const name = useMemo(() => {
        if (!user) return "Usuario";
        const first = (user.info?.firstname ?? "").toString().trim();
        const last = (user.info?.lastname ?? "").toString().trim();
        return `${first} ${last}`.trim() || user.username || "Usuario";
    }, [user]);

    const tabLabel = useMemo(() => TABS.find((item) => item.key === tab)?.label ?? "Perfil", [tab]);

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
        const handler = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (menuRef.current.contains(event.target as Node)) return;
            setShowMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!user?.role?.id) return;
        setRoleLoading(true);
        roleService
            .getOne(user.role.id)
            .then((res) => setRoleDetails(res ?? null))
            .catch(() => setRoleDetails(null))
            .finally(() => setRoleLoading(false));
    }, [user?.role?.id]);

    const renderTable = () => {
        if (!user && !loading) {
            return (
                <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    No se encontro el usuario.
                </div>
            );
        }

        if (loading) {
            return (
                <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Cargando...
                </div>
            );
        }

        if (tab === "profile") {
            return (
                <div className="grid gap-4 p-5 lg:grid-cols-2">
                    <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                            Datos principales
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Usuario
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {user?.username ?? "-"}
                                </div>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Email
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {user?.email ?? "-"}
                                </div>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Documento
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {user?.document ?? "-"}
                                </div>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Rol
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {user?.role?.name ?? "-"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                            Estado
                        </div>
                        <div className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <div className="flex flex-wrap items-center gap-3">
                                {user?.status && <UserStatusPill status={user.status}/>}
                                {user?.info?.gender && <StudentGenderPill gender={user.info.gender}/>}
                            </div>
                            <div className="mt-3 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                Este detalle se expandira con endpoints de actividad y gestion avanzada.
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (tab === "role") {
            return (
                <div className="p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                Rol asignado
                            </div>
                            <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                {user?.role?.name ?? "-"}
                            </div>
                            <div className="mt-2 text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                {roleLoading ? "Cargando..." : roleDetails?.description ?? "Sin descripcion"}
                            </div>
                        </div>

                        <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                Cantidad de permisos
                            </div>
                            <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                {roleLoading ? "..." : String(roleDetails?.countAuthorities ?? user?.role?.countAuthorities ?? 0)}
                            </div>
                            <div className="mt-2 text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                Gestion completa desde Roles.
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (tab === "activity") {
            const rows = [
                {event: "Inicio de sesion", at: "Hoy 9:12 AM", status: "OK"},
                {event: "Cambio de rol", at: "Ayer 2:40 PM", status: "Pendiente"},
            ];
            return (
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Evento</th>
                        <th scope="col">Fecha</th>
                        <th scope="col">Estado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row) => (
                        <tr key={row.event}>
                            <td><strong>{row.event}</strong></td>
                            <td>{row.at}</td>
                            <td>{row.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            );
        }

        return (
            <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                Aqui agregaremos configuraciones avanzadas cuando este la data real.
            </div>
        );
    };

    return (
        <div className="space-y-5">
            <div
                className="px-4 pb-4 pt-8 sm:px-6 sm:pb-5"
                style={{
                    background:
                        "radial-gradient(circle at top, rgba(15, 98, 254, 0.08), transparent 55%)," +
                        "radial-gradient(circle at top right, rgba(18, 128, 92, 0.06), transparent 45%)," +
                        "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))",
                }}
            >
                <div className="mx-auto flex w-full max-w-[1480px] flex-col items-center text-center">
                    <div
                        className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}
                    >
                        {user?.info?.image ? (
                            <img src={user.info.image} alt="Avatar" className="h-full w-full rounded-full object-cover"/>
                        ) : (
                            <span className="text-2xl font-extrabold" style={{color: "var(--accent)"}}>
                                {getInitials(name)}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                            Usuario:
                        </span>
                        <h2 className="max-w-[min(92vw,720px)] truncate text-xl font-semibold" style={{color: "var(--text-primary)"}}>
                            {name}
                        </h2>
                        {hasAuthority(AuthorityKey.USER_EDIT) && (
                            <button
                                type="button"
                                className="icon-button h-9 w-9"
                                title="Editar"
                                disabled={!user}
                                onClick={() => setShowEdit(true)}
                            >
                                <i className="fa fa-pen"/>
                            </button>
                        )}
                        {hasAuthority(AuthorityKey.USER_STATUS_UPDATE) && <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                className="icon-button h-9 w-9"
                                title="Opciones"
                                disabled={!user}
                                onClick={() => setShowMenu((value) => !value)}
                            >
                                <i className="fa fa-gear"/>
                            </button>

                            {showMenu && user && (
                                <div className="floating-panel right-0 mt-2 w-72">
                                    <div className="floating-panel-header">Opciones</div>
                                    <div className="space-y-1 p-2">
                                        {([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.CANCELLED] as const)
                                            .filter((status) => status !== user.status)
                                            .map((status) => {
                                                const tone =
                                                    status === UserStatus.ACTIVE
                                                        ? {bg: "var(--success-soft)", fg: "var(--success)", icon: "fa-circle-check"}
                                                        : status === UserStatus.INACTIVE
                                                            ? {bg: "var(--muted)", fg: "var(--text-secondary)", icon: "fa-circle-pause"}
                                                            : {bg: "rgba(209, 79, 92, 0.12)", fg: "var(--danger)", icon: "fa-ban"};
                                                const actionLabel =
                                                    status === UserStatus.ACTIVE
                                                        ? "Activar"
                                                        : status === UserStatus.INACTIVE
                                                            ? "Inactivar"
                                                            : "Cancelar";
                                            return (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    disabled={updatingStatus}
                                                    onClick={() => {
                                                        if (!user?.id) return;
                                                        setUpdatingStatus(true);
                                                        userService
                                                            .updateStatus(user.id, status)
                                                            .then(() => {
                                                                toast.success("Estado actualizado.");
                                                                setShowMenu(false);
                                                                void refresh();
                                                            })
                                                            .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el estado."))
                                                            .finally(() => setUpdatingStatus(false));
                                                    }}
                                                    className="profile-menu-item w-full"
                                                >
                                                    <span
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
                                                        style={{background: tone.bg, color: tone.fg}}
                                                    >
                                                        <i className={clsx("fa", tone.icon)}/>
                                                    </span>
                                                    <span className="flex-1 text-left">
                                                        {actionLabel}
                                                    </span>
                                                    <i className="fa fa-chevron-right text-[10px] text-[var(--text-tertiary)]"/>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>}
                    </div>

                    <div className="mt-2 text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                        Detalles · {tabLabel}
                    </div>

                    <div className="mt-3 grid w-full max-w-[920px] grid-cols-1 gap-2 text-sm sm:grid-cols-3" style={{color: "var(--text-secondary)"}}>
                        <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-at" style={{color: "var(--text-tertiary)"}}/>
                            <span className="min-w-0 truncate">{user?.username ?? "-"}</span>
                        </div>
                        <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-user-shield" style={{color: "var(--text-tertiary)"}}/>
                            <span className="min-w-0 truncate">{user?.role?.name ?? "-"}</span>
                        </div>
                        <div className="inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-circle-check" style={{color: "var(--text-tertiary)"}}/>
                            <span className="min-w-0 truncate">{user?.status ?? "-"}</span>
                        </div>
                    </div>

                    <RightModal
                        title="Editar usuario"
                        isOpen={hasAuthority(AuthorityKey.USER_EDIT) && showEdit}
                        onClose={() => setShowEdit(false)}
                        className="w-[420px] h-full z-[9999]"
                    >
                        <div className="p-5 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                            Edicion completa se conecta en una siguiente iteracion.
                        </div>
                    </RightModal>
                </div>
            </div>

            <div className="surface-card">
                <div className="surface-card-header">
                    <div className="flex min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {TABS.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setTab(item.key)}
                                    className={clsx("section-tab", tab === item.key && "section-tab-active")}
                                >
                                    <i className={clsx("fa", item.icon)}/>
                                    <span>{item.label}</span>
                                    <small>{item.hint}</small>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button className="btn btn-sm btn-primary" type="button" disabled>
                            <i className="fa fa-plus me-1"/>
                            <span>Nuevo</span>
                        </button>
                    </div>
                </div>

                <div className="data-table-card-body">
                    <div className="mt-4 overflow-hidden rounded-[22px] border" style={{borderColor: "var(--border-soft)"}}>
                        {renderTable()}
                    </div>
                </div>
            </div>
        </div>
    );
};
