import {useEffect, useMemo, useRef, useState} from "react";
import {isNil} from "lodash";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";
import {PeriodConfig, PeriodConfigService} from "../../../services/period/PeriodConfigService.ts";
import {UserOrganizationService} from "../../../services/user/UserOrganizationService.ts";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import {useCompany} from "../../../contexts/CompanyContext.tsx";
import {environment} from "../../../environment/environment.ts";
import {joinURLParts} from "../../../utils/URIs.ts";
import {OrganizationService} from "../../../services/organization/OrganizationService.ts";

type MainNavbarProps = {
    subtitle: string;
    onOpenSidebar: () => void;
    breadcrumbs?: Array<{
        label: string;
        onClick?: () => void;
    }>;
};

export const MainNavbar = ({subtitle, onOpenSidebar, breadcrumbs = []}: MainNavbarProps) => {
    const {notification} = useQueryParams();
    const {current, logout}: AuthContextValue = useAuthContext();
    const {rnc, setRnc} = useCompany();
    const [periodConfig, setPeriodConfig] = useState<PeriodConfig | null>(null);
    const [organizations, setOrganizations] = useState<UserOrganizationDTO[]>([]);
    const [orgLoading, setOrgLoading] = useState(false);
    const [currentOrganization, setCurrentOrganization] = useState<{
        name?: string;
        logo?: string;
        document?: string
    } | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showOrgMenu, setShowOrgMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const orgMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        PeriodConfigService.instance.after()
            .then((config) => setPeriodConfig(config))
            .catch(() => setPeriodConfig(null));
    }, []);

    useEffect(() => {
        // Uses OrganizationContext (X-Auth-Company) on backend to return the currently logged organization.
        OrganizationService.instance
            .current()
            .then((org) => setCurrentOrganization(org ?? null))
            .catch(() => setCurrentOrganization(null));
    }, [rnc]);

    useEffect(() => {
        const loadOrganizations = async () => {
            setOrgLoading(true);
            try {
                const res = await UserOrganizationService.instance.current();
                const list = Array.isArray(res) ? res : (res?.organization ? [res] : []);
                setOrganizations(list);
                if (!rnc && list.length === 1 && list[0]?.organization?.document) {
                    setRnc(list[0].organization.document);
                }
            } catch {
                setOrganizations([]);
            } finally {
                setOrgLoading(false);
            }
        };
        void loadOrganizations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (notification === "show") {
            setShowNotifications(true);
        }
    }, [notification]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
                setShowOrgMenu(false);
            }
        };

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowProfileMenu(false);
                setShowNotifications(false);
                setShowOrgMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const formatShortDate = (value?: string) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat("es", {day: "2-digit", month: "short", year: "numeric"}).format(date);
    };

    const resolveLogo = (value?: string | null) => {
        const raw = (value ?? "").toString().trim();
        if (!raw) return null;
        if (/^data:/i.test(raw)) return raw;
        if (/^https?:\/\//i.test(raw)) return raw;
        // Backend may return relative paths; normalize against api URL.
        return joinURLParts(environment.apiURL, raw.startsWith("/") ? raw : `/${raw}`);
    };

    const startLabel = formatShortDate(periodConfig?.start);
    const enabled = Boolean(periodConfig?.enabled);
    const currentOrg = currentOrganization ?? organizations.find((o) => o.organization.document === rnc)?.organization ?? null;

    const orgInitials = useMemo(() => {
        const name = (currentOrg?.name ?? "").trim();
        if (!name) return "";
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }, [currentOrg?.name]);

    return (
        <>
            <header className="app-topbar">
                <div className="app-topbar-inner">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            className="icon-button lg:hidden"
                            onClick={onOpenSidebar}
                            title="Abrir menu"
                        >
                            <i className="fa fa-bars"/>
                        </button>

                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                {subtitle}
                            </p>
                            {breadcrumbs.length > 0 && (
                                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold">
                                    {breadcrumbs.map((crumb, index) => {
                                        const clickable = typeof crumb.onClick === "function";
                                        return (
                                            <span key={`${crumb.label}-${index}`}
                                                  className="inline-flex min-w-0 items-center gap-1.5">
                                                {index > 0 && <span className="text-[var(--text-tertiary)]">/</span>}
                                                {clickable ? (
                                                    <button
                                                        type="button"
                                                        onClick={crumb.onClick}
                                                        className="max-w-[220px] truncate text-[var(--accent)] transition hover:opacity-80 hover:underline"
                                                        title={crumb.label}
                                                    >
                                                        {crumb.label}
                                                    </button>
                                                ) : (
                                                    <span
                                                        className="max-w-[220px] truncate text-[var(--text-secondary)]"
                                                        title={crumb.label}>
                                                        {crumb.label}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden lg:flex items-center gap-2">
                            {organizations.length > 0 && (
                                <div className="relative" ref={orgMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (organizations.length <= 1) return;
                                            setShowOrgMenu((value) => !value);
                                        }}
                                        className="inline-flex items-center gap-2 rounded-[18px] border px-2.5 py-1.5 text-left transition"
                                        style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                                        title={currentOrg?.name ?? "Espacio de trabajo"}
                                    >
                                        <div
                                            className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-xl border"
                                            style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}
                                        >
                                            {resolveLogo(currentOrg?.logo) ? (
                                                <img src={resolveLogo(currentOrg?.logo) as string} alt="Logo"
                                                     className="h-full w-full object-cover"/>
                                            ) : (
                                                <span className="text-[11px] font-extrabold"
                                                      style={{color: "var(--text-secondary)"}}>
                                                    {orgInitials || "—"}
                                                </span>
                                            )}
                                        </div>
                                        {organizations.length > 1 && (
                                            <i className="fa fa-chevron-down text-[10px] text-[var(--text-tertiary)]"/>
                                        )}
                                    </button>

                                    {organizations.length > 1 && showOrgMenu && (
                                        <div className="floating-panel left-0 mt-3 w-[340px]">
                                            <div className="floating-panel-header">
                                                {orgLoading ? "Cargando..." : "Espacios de trabajo"}
                                            </div>
                                            <div className="p-3">
                                                <div className="grid gap-2 max-h-[320px] overflow-auto pr-1">
                                                    {organizations.map((item) => {
                                                        const org = item.organization;
                                                        const selected = org.document === rnc;
                                                        return (
                                                            <button
                                                                key={org.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (selected) return;
                                                                    setRnc(org.document);
                                                                    window.location.reload();
                                                                }}
                                                                className="rounded-[22px] border p-3 text-left transition"
                                                                style={{
                                                                    borderColor: selected ? "var(--accent)" : "var(--border-soft)",
                                                                    background: selected ? "color-mix(in srgb, var(--accent-soft) 65%, var(--surface))" : "var(--surface)",
                                                                    boxShadow: "var(--shadow-soft)",
                                                                }}
                                                                title={org.name}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div
                                                                            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[16px] border"
                                                                            style={{
                                                                                borderColor: "var(--border-soft)",
                                                                                background: "var(--surface-muted)"
                                                                            }}
                                                                        >
                                                                            {resolveLogo(org.logo) ? (
                                                                                <img
                                                                                    src={resolveLogo(org.logo) as string}
                                                                                    alt="Logo"
                                                                                    className="h-full w-full object-cover"/>
                                                                            ) : (
                                                                                <span className="text-xs font-extrabold"
                                                                                      style={{color: "var(--text-secondary)"}}>
                                                                                    {org.name
                                                                                        ?.split(" ")
                                                                                        .map((w) => w.charAt(0))
                                                                                        .slice(0, 2)
                                                                                        .join("")
                                                                                        .toUpperCase() || "—"}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div
                                                                                className="truncate text-sm font-extrabold"
                                                                                style={{color: "var(--text-primary)"}}>
                                                                                {org.name}
                                                                            </div>
                                                                            <div
                                                                                className="mt-1 truncate text-xs font-semibold"
                                                                                style={{color: "var(--text-tertiary)"}}>
                                                                                {org.document}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <span
                                                                        className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                                                        style={{
                                                                            background: selected ? "var(--accent-soft)" : "var(--surface-muted)",
                                                                            color: selected ? "var(--accent)" : "var(--text-secondary)",
                                                                        }}
                                                                    >
                                                                        {selected ? "Actual" : "Cambiar"}
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                                title="Calendario escolar"
                            >
                                <span
                                    className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                                    Proximo año escolar
                                </span>
                                <span className="ml-2">
                                    {startLabel ? `Inicia ${startLabel}` : "Sin configurar"}

                                </span>
                            </div>

                            {enabled && (
                                <button
                                    type="button"
                                    className="icon-button"
                                    title="Configurar ano escolar"
                                    onClick={() => {
                                        // TODO: abrir modal de configuracion
                                    }}
                                >
                                    <i className="fa fa-gear"/>
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowNotifications((currentValue) => !currentValue)}
                                className="icon-button relative"
                                title="Notificaciones"
                            >
                                <i className="fa fa-bell"/>
                                <span className="notification-dot"/>
                            </button>

                            {showNotifications && (
                                <div className="floating-panel right-0 mt-3 w-72">
                                    <div className="floating-panel-header">Notificaciones</div>
                                    <div className="space-y-3 p-3">
                                        <div className="notification-card">
                                            <strong>Cierre de caja</strong>
                                            <p>Dos pagos quedaron pendientes de validacion manual.</p>
                                        </div>
                                        <div className="notification-card">
                                            <strong>Actividad reciente</strong>
                                            <p>Hay movimientos nuevos en inscripciones y pagos del dia.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setShowProfileMenu((currentValue) => !currentValue)}
                                className="profile-button"
                                title="Perfil de usuario"
                            >
                                <LoadingContent loading={isNil(current)}>
                                    <img
                                        src={current?.info.image || "/default-avatar.png"}
                                        alt="Avatar"
                                        className="h-9 w-9 rounded-xl object-cover"
                                    />
                                </LoadingContent>
                                <i className="fa fa-chevron-down text-[10px] text-[var(--text-tertiary)]"/>
                            </button>

                            {showProfileMenu && (
                                <div className="floating-panel right-0 mt-3 w-64">
                                    <div className="space-y-1 p-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowChangePassword(true);
                                                setShowProfileMenu(false);
                                            }}
                                            className="profile-menu-item w-full"
                                        >
                                            <i className="fa fa-key text-[var(--accent)]"/>
                                            <span>Cambiar contrasena</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => logout?.()}
                                            className="profile-menu-item w-full text-[var(--danger)]"
                                        >
                                            <i className="fa fa-sign-out"/>
                                            <span>Cerrar sesion</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <LeftModal
                title="Cambiar contrasena"
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <ChangePasswordForm onSubmit={() => setShowChangePassword(false)}/>
            </LeftModal>
        </>
    );
};
