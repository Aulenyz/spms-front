import {useEffect, useRef, useState} from "react";
import {isNil} from "lodash";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";
import {ThemeToggle} from "../../../components/ui/theme/ThemeToggle.tsx";

type MainNavbarProps = {
    title: string;
    subtitle: string;
    onOpenSidebar: () => void;
};

export const MainNavbar = ({title, subtitle, onOpenSidebar}: MainNavbarProps) => {
    const {notification} = useQueryParams();
    const {current, logout}: AuthContextValue = useAuthContext();
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
                            <h1 className="truncate text-lg font-semibold text-[var(--text-primary)]">
                                {title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden lg:flex">
                            <label className="relative">
                                <i className="fa fa-search sidebar-search-icon"/>
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Buscar"
                                    className="sidebar-search-input min-w-[220px] pl-10"
                                />
                            </label>
                        </div>

                        <ThemeToggle/>

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
