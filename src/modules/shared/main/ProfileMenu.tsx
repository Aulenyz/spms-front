import {memo, useCallback, useRef, useState} from "react";
import {isNil} from "../../../utils/lang.ts";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useDismiss} from "./useDismiss.ts";

/** Avatar del usuario con menú (cambiar contraseña / cerrar sesión). */
export const ProfileMenu = memo(() => {
    const {current, logout} = useAuthContext();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useDismiss(menuRef, useCallback(() => setShowProfileMenu(false), []));

    return (
        <>
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
                                <span>Cambiar contraseña</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => logout?.()}
                                className="profile-menu-item w-full text-[var(--danger)]"
                            >
                                <i className="fa fa-sign-out"/>
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
});
