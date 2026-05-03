import {useEffect, useRef, useState} from "react";
import {isNil} from "lodash";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";
import {PeriodConfig, PeriodConfigService} from "../../../services/period/PeriodConfigService.ts";

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
    const [periodConfig, setPeriodConfig] = useState<PeriodConfig | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        PeriodConfigService.instance.after()
            .then((config) => setPeriodConfig(config))
            .catch(() => setPeriodConfig(null));
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
        };

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowProfileMenu(false);
                setShowNotifications(false);
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

    const startLabel = formatShortDate(periodConfig?.start);
    const endLabel = formatShortDate(periodConfig?.end);
    const enabled = Boolean(periodConfig?.enabled);

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
                                            <span key={`${crumb.label}-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
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
                                                    <span className="max-w-[220px] truncate text-[var(--text-secondary)]" title={crumb.label}>
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
                            <div
                                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                                title="Calendario escolar"
                            >
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                                    Proximo ano escolar
                                </span>
                                <span className="ml-2">
                                    {startLabel && endLabel
                                        ? `Inicia ${startLabel} - Termina ${endLabel}`
                                        : startLabel
                                            ? `Inicia ${startLabel}`
                                            : endLabel
                                                ? `Termina ${endLabel}`
                                                : "Sin configurar"}
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
                                <div className="hidden text-left sm:block">
                                    <p className="max-w-[160px] truncate text-sm font-semibold text-[var(--text-primary)]">
                                        {current?.info.firstname} {current?.info.lastname}
                                    </p>
                                    <p className="max-w-[160px] truncate text-xs text-[var(--text-secondary)]">
                                        {current?.email ?? current?.username}
                                    </p>
                                </div>
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
