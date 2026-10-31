import {useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {AuthorityService} from "../../../../services/user/AuthorityService.ts";
import {RoleService} from "../../../../services/user/RoleService.ts";
import {UserAuthority, UserRole} from "../../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../../domain/filters/Page.ts";
import {useAuthContext} from "../../../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../../../domain/model/user/authorities.ts";
import {DetailHeader} from "../../../../components/ui/detail/DetailHeader.tsx";
import {DetailSection} from "../../../../components/ui/detail/DetailSection.tsx";
import {Badge} from "../../../../components/ui/detail/StatusBadge.tsx";
import {EmptyState} from "../../../../components/ui/feedback/EmptyState.tsx";
import {LoadingContent} from "../../../../components/io/output/LoadingContent.tsx";

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

export const RoleDetailsPage = () => {
    const {hasAuthority} = useAuthContext();
    const {id} = useParams<{id: string}>();
    const location = useLocation();
    const stateRole = (location.state as {role?: UserRole} | null)?.role;

    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<UserRole | null>(stateRole ?? null);

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

    const moveAuthority = async (authId: number | null, target: "assigned" | "unassigned") => {
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

    const canAssign = hasAuthority(AuthorityKey.ROLE_ASSIGN_AUTHORITIES);
    const permissionCount = role?.countAuthorities ?? role?.authorities?.length ?? 0;
    const assignedReadOnly = (role?.authorities ?? []).map((ra) => ra.authority).filter(Boolean) as UserAuthority[];

    const renderColumn = (bucket: "assigned" | "unassigned", items: UserAuthority[]) => {
        const isAssigned = bucket === "assigned";
        return (
            <div
                className={clsx("flex min-h-0 flex-col transition-colors", dragOver === bucket && "bg-[var(--accent-soft)]")}
                onDragEnter={() => setDragOver(bucket)}
                onDragLeave={() => setDragOver((prev) => (prev === bucket ? null : prev))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                    setDragOver(null);
                    void moveAuthority(dragIdRef.current, bucket);
                }}
            >
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                    <span className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                        {isAssigned ? "Asignados" : "Disponibles"}
                    </span>
                    <Badge>{items.length}</Badge>
                </div>
                <div className="max-h-[60vh] overflow-auto">
                    {!isAssigned && authorityLoading && items.length === 0 && <LoadingContent loading className="py-10"/>}
                    {!authorityLoading && items.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm" style={{color: "var(--text-secondary)"}}>
                            {isAssigned ? "Sin permisos asignados." : "No hay permisos disponibles."}
                        </p>
                    )}
                    <ul className="divide-y divide-[var(--border-soft)]">
                        {items.map((auth) => (
                            <li
                                key={auth.id}
                                draggable={!updating}
                                onDragStart={() => (dragIdRef.current = auth.id)}
                                onDragEnd={() => {
                                    dragIdRef.current = null;
                                    setDragOver(null);
                                }}
                                title={auth.description || undefined}
                                className={clsx(
                                    "flex cursor-grab items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--surface-muted)]",
                                    animPulse?.id === auth.id && animPulse.bucket === bucket && "bg-[var(--accent-soft)]"
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>{auth.name}</div>
                                    <div className="truncate text-xs" style={{color: "var(--text-tertiary)"}}>{auth.key}</div>
                                </div>
                                <button
                                    type="button"
                                    className={isAssigned ? "row-action row-action-danger" : "row-action"}
                                    disabled={updating}
                                    title={isAssigned ? "Quitar permiso" : "Asignar permiso"}
                                    aria-label={isAssigned ? "Quitar permiso" : "Asignar permiso"}
                                    onClick={() => void moveAuthority(auth.id, isAssigned ? "unassigned" : "assigned")}
                                >
                                    <i className={isAssigned ? "fa fa-minus" : "fa fa-plus"}/>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {!isAssigned && hasMoreAuthorities && (
                        <div className="border-t px-4 py-3" style={{borderColor: "var(--border-soft)"}}>
                            <button
                                type="button"
                                className="btn btn-sm w-full"
                                disabled={authorityLoading}
                                onClick={() => {
                                    const next = authorityPage + 1;
                                    setAuthorityPage(next);
                                    void loadAuthoritiesPage(next);
                                }}
                            >
                                {authorityLoading ? "Cargando..." : "Cargar más permisos"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading && !role) return <LoadingContent loading className="py-16"/>;
    if (!role) return <EmptyState title="No se encontró el rol" description="Vuelve al listado e intenta nuevamente." icon="fa-user-shield"/>;

    return (
        <div className="space-y-4">
            <DetailHeader
                avatar="fa-user-shield"
                title={name}
                subtitle={role.description || "Sin descripción"}
                badges={<Badge>{permissionCount} {permissionCount === 1 ? "permiso" : "permisos"}</Badge>}
            />

            {canAssign ? (
                <DetailSection
                    title="Permisos"
                    description="Asigna o quita permisos con los botones o arrastrándolos entre columnas."
                    flush
                    actions={
                        <label className="input input-sm flex w-full items-center gap-2 sm:w-72">
                            <i className="fa fa-search text-xs" style={{color: "var(--text-tertiary)"}}/>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por llave o nombre"
                                className="min-w-0 flex-1 bg-transparent outline-none"
                            />
                        </label>
                    }
                >
                    <div className="grid divide-y divide-[var(--border-soft)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                        {renderColumn("unassigned", unassigned)}
                        {renderColumn("assigned", assigned)}
                    </div>
                </DetailSection>
            ) : (
                <DetailSection title="Permisos asignados" flush>
                    {assignedReadOnly.length ? (
                        <table className="table-shell">
                            <thead>
                            <tr>
                                <th>Permiso</th>
                                <th>Llave</th>
                                <th>Descripción</th>
                            </tr>
                            </thead>
                            <tbody>
                            {assignedReadOnly.map((auth) => (
                                <tr key={auth.id}>
                                    <td className="font-semibold text-[var(--text-primary)]">{auth.name}</td>
                                    <td className="text-xs">{auth.key}</td>
                                    <td>{auth.description || "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-5">
                            <EmptyState title="Sin permisos" description="Este rol todavía no tiene permisos asignados." icon="fa-key"/>
                        </div>
                    )}
                </DetailSection>
            )}
        </div>
    );
};
