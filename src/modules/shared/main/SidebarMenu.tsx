import {useState} from "react";
import SidebarLink from "./SidebarLink";

interface Props {
    collapsed?: boolean;
}

const SidebarMenu = ({collapsed}: Props) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const toggleMenu = (menu: string) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
            <SidebarLink to="/home" icon="fa-house" label="Dashboard" collapsed={collapsed}/>

            <button
                onClick={() => toggleMenu("profile")}
                className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    openMenu === "profile"
                        ? "bg-blue-600 text-white"
                        : "hover:bg-blue-50 text-gray-700"
                }`}
            >
                <div className="flex items-center gap-3">
                    <i className="fas fa-user text-sm"></i>
                    {!collapsed && <span className="text-sm font-medium">Perfil</span>}
                </div>
                {!collapsed && (
                    <i
                        className={`fas text-xs transition-transform ${
                            openMenu === "profile" ? "fa-chevron-up" : "fa-chevron-down"
                        }`}
                    ></i>
                )}
            </button>

            {!collapsed && openMenu === "profile" && (
                <ul className="ml-10 mt-1 space-y-1 text-sm text-gray-600">
                    <li>
                        <SidebarLink to="/profile/overview" label="General" sub/>
                    </li>
                    <li>
                        <SidebarLink to="/profile/projects" label="Proyectos" sub/>
                    </li>
                </ul>
            )}
            <SidebarLink to="/sales" icon="fa-dollar-sign" label="Ventas" collapsed={collapsed}/>
        </nav>
    );
};

export default SidebarMenu;
