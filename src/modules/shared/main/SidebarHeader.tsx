import clsx from "clsx";
import {Organization} from "../../../domain/model/user/user.ts";

const SidebarHeader = ({organization, collapsed, onToggle}: {
    organization?: Organization,
    collapsed: boolean,
    onToggle: () => void
}) => (
    <div
        className={clsx(
            "relative flex items-center justify-between border-b border-gray-100 px-4 transition-all duration-300 pt-8 pb-6",
            collapsed ? "flex-col gap-4" : "flex-row"
        )}
    >
        <div
            className={clsx(
                "flex items-center transition-all duration-300",
                collapsed ? "flex-col" : "gap-3"
            )}
        >
            {/* Logo */}
            <div
                className="relative flex items-center justify-center bg-blue-100 text-blue-600 rounded-2xl w-14 h-14 font-bold shadow-sm">
                {organization?.logo ? (
                    <img
                        src={organization.logo}
                        alt="Logo"
                        className="w-14 h-14 rounded-2xl object-cover border border-blue-200 shadow-md"
                    />
                ) : (
                    <span className="text-lg">C</span>
                )}
            </div>

            {/* Información de organización */}
            {!collapsed && (
                <div className="flex flex-col leading-tight">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {organization?.name || "Compañía"}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {organization?.document || "------"}
                    </p>
                </div>
            )}
        </div>

        {/* Botón toggle */}
        <button
            onClick={onToggle}
            className={clsx(
                "absolute top-5 right-5 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 shadow-sm border",
                "bg-white/80 border-gray-200 backdrop-blur-sm",
                "hover:bg-blue-100 hover:text-blue-700 hover:scale-110",
                "text-gray-500"
            )}
            title={collapsed ? "Mostrar menú" : "Ocultar menú"}
        >
            <i
                className={clsx(
                    "fas text-base transition-transform duration-300",
                    collapsed ? "fa-angles-right" : "fa-angles-left"
                )}
            ></i>
        </button>

    </div>
);

export default SidebarHeader;
