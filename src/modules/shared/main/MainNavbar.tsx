import {useEffect, useRef, useState} from "react";
import {useNavigate, useSearchParams} from "react-router-dom";
import {isNil} from "lodash";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";

export const MainNavbar = () => {
    const navigate = useNavigate();
    const [_, setSearchParams] = useSearchParams();
    const {notification} = useQueryParams();
    const {current}: AuthContextValue = useAuthContext();

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const bellRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (notification === "show") {
            setShowNotifications(true);
            setSearchParams({});
        }
    }, [notification]);

    // 🔹 Cierra menú al hacer clic fuera o presionar Esc
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setShowProfileMenu(false);
            }
        };
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") setShowProfileMenu(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token_info");
        localStorage.removeItem("authorities_info");
        navigate("/auth/login", {replace: true});
    };

    return (
        <>
            <header className="sticky top-0 z-20 w-full bg-white shadow-sm border-b border-gray-100">
                <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
                    {/* ─── Izquierda ───────────────────────────── */}
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
                            title="Abrir menú"
                        >
                            <i className="fa fa-bars text-lg"></i>
                        </button>
                        <h1 className="hidden sm:block text-[16px] font-semibold text-gray-700">
                            Panel Principal
                        </h1>
                    </div>

                    {/* ─── Derecha ───────────────────────────── */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Buscar */}
                        <button
                            className="p-2 rounded-full hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
                            title="Buscar"
                        >
                            <i className="fa fa-search text-lg"></i>
                        </button>

                        {/* Notificaciones */}
                        <div className="relative">
                            <button
                                ref={bellRef}
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-full hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition"
                                title="Notificaciones"
                            >
                                <i className="fa fa-bell text-lg"></i>
                                <span
                                    className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                            </button>

                            {showNotifications && (
                                <div
                                    className="absolute right-0 mt-2 w-72 bg-white shadow-md rounded-md border border-gray-100 overflow-hidden animate-fade-in">
                                    <div
                                        className="px-4 py-2 border-b border-gray-100 text-sm font-semibold text-gray-700">
                                        Notificaciones
                                    </div>
                                    <div className="max-h-60 overflow-y-auto text-sm">
                                        <div className="p-3 text-gray-500 text-center text-xs">
                                            No hay notificaciones nuevas
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Perfil */}
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-2 focus:outline-none"
                                title="Perfil de usuario"
                            >
                                <LoadingContent loading={isNil(current)}>
                                    <img
                                        src={current?.info.image || "/default-avatar.png"}
                                        alt="Foto de perfil"
                                        className="w-9 h-9 rounded-full border-2 border-blue-500 object-cover"
                                    />
                                </LoadingContent>
                            </button>

                            {showProfileMenu && (
                                <div
                                    className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
                                    <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                                        <img
                                            src={current?.info.image || "/default-avatar.png"}
                                            alt="Avatar"
                                            className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800 text-sm">
                                                {current?.info.firstname} {current?.info.lastname}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">
                                                {current?.email ?? current?.username}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col text-sm text-gray-700">
                                        <button
                                            onClick={() => {
                                                setShowChangePassword(true);
                                                setShowProfileMenu(false);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 transition text-left"
                                        >
                                            <i className="fa fa-key text-blue-500"></i>
                                            <span>Cambiar contraseña</span>
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-left text-red-600 transition"
                                        >
                                            <i className="fa fa-sign-out"></i>
                                            <span>Cerrar sesión</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal de cambio de contraseña */}
            <LeftModal
                title="Cambiar contraseña"
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <ChangePasswordForm onSubmit={() => setShowChangePassword(false)}/>
            </LeftModal>
        </>
    );
};
