import {isNil} from "lodash";
import {NavigateFunction, useNavigate, useSearchParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";

export const MainNavbar = () => {

    const navigate: NavigateFunction = useNavigate();
    const [_, setSearchParams] = useSearchParams();
    const {notification} = useQueryParams();
    const {current}: AuthContextValue = useAuthContext();
    const [changePassModal, setChangePassModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const bellRef = useRef<HTMLButtonElement>(null);

    const handleChangePassword = () => {
        setChangePassModal(false);
    };

    useEffect(() => {
        if (notification === 'show') {
            setShowNotifications(true);
            setSearchParams({});
        }
    }, [notification])

    return (
        <>
            <header
                className="header fixed top-0 z-10 start-0 end-0 flex items-stretch shrink-0 bg-white shadow"
                data-sticky="true" data-sticky-class="shadow-sm" data-sticky-name="header" id="header">
                <div className="container-fixed flex justify-between items-stretch lg:gap-4" id="header_container">
                    <div className="flex gap-1 lg:hidden items-center -ms-1">
                        <a className="shrink-0">
                            {/*<img className="max-h-[25px] w-full" src="/logo.png" alt=""/>*/}
                        </a>
                        <div className="flex items-center">
                            <button className="btn btn-icon btn-light btn-clear btn-sm" data-drawer-toggle="#sidebar">
                                <i className="fa fa-ellipsis-h"></i>
                            </button>
                        </div>
                    </div>

                    <div data-reparent-target="#content_container|lg:#header_container" data-reparent="true"
                         className="flex [.header_&]:below-lg:hidden items-center gap-1.25 text-xs lg:text-sm font-medium mb-2.5 lg:mb-0"
                         data-reparent-mode="prepend|lg:prepend">
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3.5">
                        <button
                            className="btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500">
                            <i className="fa fa-search"></i>
                        </button>

                        <button
                            ref={bellRef}
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500"
                        >
                            <i className="fa fa-bell"></i>
                        </button>

                        <div className="menu" data-menu="true">
                            <div className="menu-item" data-menu-item-offset="20px, 10px"
                                 data-menu-item-offset-rtl="-20px, 10px" data-menu-item-placement="bottom-end"
                                 data-menu-item-placement-rtl="bottom-start" data-menu-item-toggle="dropdown"
                                 data-menu-item-trigger="click|lg:click">
                                <div className="menu-toggle btn btn-icon rounded-full">
                                    <LoadingContent className="text-blue-500" loading={isNil(current)}>
                                        <img src={current?.info.image} alt="Profile Image"
                                             className="size-9 rounded-full border-2 border-success shrink-0"/>
                                    </LoadingContent>
                                </div>
                                <div
                                    className="menu-dropdown menu-default light:border-gray-300 w-screen max-w-[350px]">
                                    <div className="flex items-center justify-between px-5 py-1.5 gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <img alt="" className="size-9 rounded-full border-2 border-success"
                                                 src={current?.info.image}/>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm text-gray-800 font-semibold leading-none">
                                                    {current?.info.firstname}
                                                </span>
                                                <a className="text-xs text-gray-600 hover:text-primary font-medium leading-none">
                                                    {current?.email ?? current?.username}
                                                </a>
                                            </div>
                                        </div>
                                        <span className="badge badge-xs badge-primary badge-outline">
                                            {current?.role.name}
                                        </span>
                                    </div>
                                    <div className="menu-separator"></div>

                                    <div className="menu-separator"></div>
                                    <div className="flex flex-col">
                                        <div className="menu-item" data-menu-dismiss="true">
                                            <a className="menu-link">
                                                <span className="menu-icon">
                                                    <i className="fa fa-user-cog fa-fw"></i>
                                                </span>
                                                <span className="menu-title">Configuración de mi Perfil</span>
                                            </a>
                                        </div>

                                        <div className="menu-item" data-menu-dismiss="true">
                                            <button className="menu-link"
                                                    onClick={() => setChangePassModal(true)}>
                                                <span className="menu-icon">
                                                    <i className="fa fa-key fa-fw"></i></span>
                                                <span className="menu-title">Cambiar Contraseña</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="menu-separator"></div>
                                    <div className="flex flex-col">
                                        <div className="menu-item px-4 py-1.5">
                                            <a className="btn btn-sm btn-light justify-center"
                                               onClick={() => {
                                                   localStorage.removeItem("token_info");
                                                   localStorage.removeItem("authorities_info");
                                                   navigate('auth/login')
                                               }}>
                                                Cerrar Sesión
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <LeftModal
                        title="Cambiar Contraseña"
                        isOpen={changePassModal}
                        onClose={() => setChangePassModal(false)}
                        className="w-[30%] h-full z-[9999]">
                        <ChangePasswordForm onSubmit={handleChangePassword}/>
                    </LeftModal>
                </div>
            </header>
        </>
    );
}