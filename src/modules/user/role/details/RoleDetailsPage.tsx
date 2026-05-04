import {useEffect, useMemo, useRef, useState} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {AuthorityService} from "../../../../services/user/AuthorityService.ts";
import {RoleService} from "../../../../services/user/RoleService.ts";
import {UserAuthority, UserRole} from "../../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../../domain/filters/Page.ts";
import {useAuthContext} from "../../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../../domain/model/user/authorities.ts";

type TabKey = "details" | "authorities";

const TABS: Array<{key: TabKey; label: string; icon: string; hint: string}> = [
    {key: "details", label: "Detalles", icon: "fa-id-card", hint: "Info"},
    {key: "authorities", label: "Asignaciones", icon: "fa-sliders", hint: "Arrastrar"},
];

const roleService = RoleService.instance;
const authorityService = AuthorityService.instance;

const AUTH_PAGE_SIZE = 250;

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

export const RoleDetailsPage = () => {
    const {hasAuthority} = useAuthContext();
    const {id} = useParams<{id: string}>();
    const location = useLocation();
    const stateRole = (location.state as {role?: UserRole} | null)?.role;

    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<UserRole | null>(stateRole ?? null);
    const [tab, setTab] = useState<TabKey>("details");

    const [authorityLoading, setAuthorityLoading] = useState(false);
    const [authorities, setAuthorities] = useState<Page<UserAuthority>>(Pagination.empty<UserAuthority>());
    const [search, setSearch] = useState("");
    const [authorityPage, setAuthorityPage] = useState(0);
    const [hasMoreAuthorities, setHasMoreAuthorities] = useState(true);

    const [updating, setUpdating] = useState(false);
    const dragIdRef = useRef<number | null>(null);
    const [dragOver, setDragOver] = useState<"assigned" | "unassigned" | null>(null);
    const [animPulse, setAnimPulse] = useState<{id: number; bucket: "assigned" | "unassigned"} | null>(null);

    const refresh = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await roleService.getOne(id);
            setRole((prev) => ({...(prev ?? {} as UserRole), ...(response ?? {})} as UserRole));
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del rol.");
            setRole(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, [id]);

    const loadAuthoritiesPage = async (page: number) => {
        setAuthorityLoading(true);
        try {
            const res = await authorityService.getAll({}, Pagination.of(page, AUTH_PAGE_SIZE));
            const next = res ?? Pagination.empty<UserAuthority>();
            setAuthorities((prev) => ({
                ...(next as any),
                content: [...(prev.content ?? []), ...(next.content ?? [])],
            }));
            const totalPages = next.page?.totalPages ?? 1;
            setHasMoreAuthorities(page + 1 < totalPages);
        } catch {
            setHasMoreAuthorities(false);
        } finally {
            setAuthorityLoading(false);
        }
    };

    useEffect(() => {
        void loadAuthoritiesPage(0);
    }, []);

    const assignedIds = useMemo(() => {
        const raw = role?.authorities?.map((ra) => ra.authority?.id).filter(Boolean) as number[] | undefined;
        return new Set<number>(raw ?? []);
    }, [role?.authorities]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return authorities.content;
        return authorities.content.filter((a) => {
            const text = `${a.key ?? ""} ${a.name ?? ""} ${a.description ?? ""}`.toLowerCase();
            return text.includes(term);
        });
    }, [authorities.content, search]);

    const {assigned, unassigned} = useMemo(() => {
        const assignedList: UserAuthority[] = [];
        const unassignedList: UserAuthority[] = [];
        for (const auth of filtered) {
            if (assignedIds.has(auth.id)) assignedList.push(auth);
            else unassignedList.push(auth);
        }
        return {assigned: assignedList, unassigned: unassignedList};
    }, [assignedIds, filtered]);

    const name = useMemo(() => (role?.name ?? "Rol").toString().trim() || "Rol", [role?.name]);
    const initials = useMemo(() => getInitials(name), [name]);

    const handleDrop = async (target: "assigned" | "unassigned") => {
        const authId = dragIdRef.current;
        if (!authId || !role?.id || updating) return;

        const isAssigned = assignedIds.has(authId);
        if (target === "assigned" && isAssigned) return;
        if (target === "unassigned" && !isAssigned) return;

        const moved = authorities.content.find((a) => a.id === authId);
        if (!moved) return;

        // Optimistic UI update (fast + shows immediately), revert on error.
        setUpdating(true);
        setAnimPulse({id: authId, bucket: target});
        window.setTimeout(() => setAnimPulse(null), 520);

        setRole((prev) => {
            if (!prev) return prev;
            const current = prev.authorities ?? [];
            if (target === "assigned") {
                const exists = current.some((ra) => ra.authority?.id === authId);
                if (exists) return prev;
                return {...prev, authorities: [...current, {id: Date.now(), authority: moved} as any], countAuthorities: (prev.countAuthorities ?? 0) + 1};
            }
            const next = current.filter((ra) => ra.authority?.id !== authId);
            return {...prev, authorities: next, countAuthorities: Math.max(0, (prev.countAuthorities ?? 0) - 1)};
        });

        try {
            if (target === "assigned") await roleService.assign(role.id, [authId]);
            else await roleService.unassign(role.id, [authId]);
        } catch (error) {
            // Revert optimistic change
            setRole((prev) => {
                if (!prev) return prev;
                const current = prev.authorities ?? [];
                if (target === "assigned") {
                    const next = current.filter((ra) => ra.authority?.id !== authId);
                    return {...prev, authorities: next, countAuthorities: Math.max(0, (prev.countAuthorities ?? 0) - 1)};
                }
                const exists = current.some((ra) => ra.authority?.id === authId);
                if (exists) return prev;
                return {...prev, authorities: [...current, {id: Date.now(), authority: moved} as any], countAuthorities: (prev.countAuthorities ?? 0) + 1};
            });
            toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el permiso.");
        } finally {
            setUpdating(false);
        }
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
                        className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border text-lg font-extrabold"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)", color: "var(--text-primary)"}}
                    >
                        {initials}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-tight" style={{color: "var(--text-primary)"}}>
                            {name}
                        </h1>
                        <Link
                            to="/users/roles"
                            className="inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                            style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}
                        >
                            Roles
                        </Link>
                    </div>

                    <div className="mt-2 max-w-[820px] text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                        {role?.description ?? "Sin descripcion"}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                            Permisos: <span style={{color: "var(--text-primary)"}}>{String(role?.countAuthorities ?? role?.authorities?.length ?? 0)}</span>
                        </div>
                        {loading && (
                            <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                Cargando...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1480px] px-2 sm:px-4">
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
                    style={{
                        borderColor: "var(--border-soft)",
                        background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                        boxShadow: "var(--shadow-soft)",
                    }}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {TABS.filter((item) => item.key !== "authorities" || hasAuthority(AuthorityKey.ROLE_ASSIGN_AUTHORITIES)).map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setTab(item.key)}
                                className={clsx(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                                    item.key === tab ? "shadow-sm" : "opacity-80 hover:opacity-100"
                                )}
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: item.key === tab ? "var(--surface)" : "transparent",
                                    color: item.key === tab ? "var(--text-primary)" : "var(--text-secondary)",
                                }}
                            >
                                <i className={`fa ${item.icon}`}/>
                                <span>{item.label}</span>
                                <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                    {item.hint}
                                </span>
                            </button>
                        ))}
                    </div>

                    {tab === "authorities" && hasAuthority(AuthorityKey.ROLE_ASSIGN_AUTHORITIES) && (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-[420px]">
                                <i className="fa fa-search absolute left-3 top-3 text-sm" style={{color: "var(--text-tertiary)"}}/>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar permisos por llave o nombre..."
                                    className="w-full rounded-2xl border bg-white px-10 py-2.5 text-sm font-semibold outline-none"
                                    style={{borderColor: "var(--border-soft)", color: "var(--text-primary)"}}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 overflow-hidden rounded-[26px] border" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
                    {tab === "details" && (
                        <div className="grid gap-4 p-5 lg:grid-cols-2">
                            <div className="space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Datos del rol
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                            Nombre
                                        </div>
                                        <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                            {role?.name ?? "-"}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                            Permisos
                                        </div>
                                        <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                            {String(role?.countAuthorities ?? role?.authorities?.length ?? 0)}
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                        Descripcion
                                    </div>
                                    <div className="mt-2 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                        {role?.description ?? "Sin descripcion"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Acciones
                                </div>
                                <div className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                    <div className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                        Gestion de permisos
                                    </div>
                                    <div className="mt-2 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                        Mueve permisos entre columnas desde la pestana Permisos (arrastrando).
                                    </div>
                                    <div className="mt-4">
                                        {hasAuthority(AuthorityKey.ROLE_ASSIGN_AUTHORITIES) && (
                                            <button onClick={() => setTab("authorities")} className="btn btn-sm btn-primary" type="button">
                                                <i className="fa fa-sliders me-1"/>
                                                Administrar permisos
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "authorities" && hasAuthority(AuthorityKey.ROLE_ASSIGN_AUTHORITIES) && (
                        <div className="grid gap-4 p-4 lg:grid-cols-2">
                            <div
                                className={clsx("rounded-[22px] border p-4 transition", dragOver === "unassigned" ? "shadow-sm" : "")}
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: dragOver === "unassigned"
                                        ? "color-mix(in srgb, var(--surface) 92%, rgba(15, 98, 254, 0.05))"
                                        : "color-mix(in srgb, var(--surface) 98%, transparent)",
                                }}
                                onDragEnter={() => setDragOver("unassigned")}
                                onDragLeave={() => setDragOver((prev) => (prev === "unassigned" ? null : prev))}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                    setDragOver(null);
                                    void handleDrop("unassigned");
                                }}
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-extrabold" style={{color: "var(--text-primary)"}}>No asignados</div>
                                        <div className="text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>Arrastra hacia Asignados</div>
                                    </div>
                                    <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                        {String(unassigned.length)}
                                    </div>
                                </div>

                                <div className="grid gap-2 max-h-[62vh] overflow-auto pr-1">
                                    {authorityLoading && (
                                        <div className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                            Cargando permisos...
                                        </div>
                                    )}
                                    {!authorityLoading && unassigned.length === 0 && (
                                        <div className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                            No hay permisos disponibles.
                                        </div>
                                    )}
                                    {unassigned.map((auth) => (
                                        <div
                                            key={auth.id}
                                            draggable
                                            onDragStart={() => (dragIdRef.current = auth.id)}
                                            onDragEnd={() => {
                                                dragIdRef.current = null;
                                                setDragOver(null);
                                            }}
                                            className={clsx(
                                                "rounded-2xl border px-4 py-3 transition will-change-transform",
                                                updating ? "opacity-70" : "hover:-translate-y-[1px] hover:shadow-sm",
                                                animPulse?.id === auth.id && animPulse.bucket === "unassigned" ? "ring-2" : ""
                                            )}
                                            style={{
                                                borderColor: "var(--border-soft)",
                                                background: "var(--surface)",
                                                boxShadow: animPulse?.id === auth.id && animPulse.bucket === "unassigned"
                                                    ? "0 0 0 4px rgba(15, 98, 254, 0.14), var(--shadow-soft)"
                                                    : undefined,
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold" style={{color: "var(--text-primary)"}}>
                                                        {auth.name}
                                                    </div>
                                                    <div className="mt-1 truncate text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                                                        {auth.key}
                                                    </div>
                                                    <div className="mt-2 line-clamp-2 text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                                        {auth.description || "Permiso del sistema."}
                                                    </div>
                                                </div>
                                                <i className="fa fa-grip-vertical mt-1" style={{color: "var(--text-tertiary)"}}/>
                                            </div>
                                        </div>
                                    ))}

                                    {hasMoreAuthorities && (
                                        <button
                                            type="button"
                                            className="mt-1 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition hover:shadow-sm"
                                            style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}
                                            disabled={authorityLoading}
                                            onClick={() => {
                                                const next = authorityPage + 1;
                                                setAuthorityPage(next);
                                                void loadAuthoritiesPage(next);
                                            }}
                                        >
                                            {authorityLoading ? "Cargando..." : "Cargar mas permisos"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div
                                className={clsx("rounded-[22px] border p-4 transition", dragOver === "assigned" ? "shadow-sm" : "")}
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: dragOver === "assigned"
                                        ? "color-mix(in srgb, var(--surface) 92%, rgba(18, 128, 92, 0.05))"
                                        : "color-mix(in srgb, var(--surface) 98%, transparent)",
                                }}
                                onDragEnter={() => setDragOver("assigned")}
                                onDragLeave={() => setDragOver((prev) => (prev === "assigned" ? null : prev))}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                    setDragOver(null);
                                    void handleDrop("assigned");
                                }}
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-extrabold" style={{color: "var(--text-primary)"}}>Asignados</div>
                                        <div className="text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>Arrastra hacia No asignados</div>
                                    </div>
                                    <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                        {String(assigned.length)}
                                    </div>
                                </div>

                                <div className="grid gap-2 max-h-[62vh] overflow-auto pr-1">
                                    {!authorityLoading && assigned.length === 0 && (
                                        <div className="rounded-2xl border px-4 py-3 text-sm font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                            Arrastra permisos aqui para asignarlos.
                                        </div>
                                    )}
                                    {assigned.map((auth) => (
                                        <div
                                            key={auth.id}
                                            draggable
                                            onDragStart={() => (dragIdRef.current = auth.id)}
                                            onDragEnd={() => {
                                                dragIdRef.current = null;
                                                setDragOver(null);
                                            }}
                                            className={clsx(
                                                "rounded-2xl border px-4 py-3 transition will-change-transform",
                                                updating ? "opacity-70" : "hover:-translate-y-[1px] hover:shadow-sm",
                                                animPulse?.id === auth.id && animPulse.bucket === "assigned" ? "ring-2" : ""
                                            )}
                                            style={{
                                                borderColor: "var(--border-soft)",
                                                background: "var(--surface)",
                                                boxShadow: animPulse?.id === auth.id && animPulse.bucket === "assigned"
                                                    ? "0 0 0 4px rgba(18, 128, 92, 0.14), var(--shadow-soft)"
                                                    : undefined,
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold" style={{color: "var(--text-primary)"}}>
                                                        {auth.name}
                                                    </div>
                                                    <div className="mt-1 truncate text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                                                        {auth.key}
                                                    </div>
                                                    <div className="mt-2 line-clamp-2 text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                                        {auth.description || "Permiso del sistema."}
                                                    </div>
                                                </div>
                                                <i className="fa fa-grip-vertical mt-1" style={{color: "var(--text-tertiary)"}}/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
