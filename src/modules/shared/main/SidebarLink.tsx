import {Link, useLocation} from "react-router-dom";
import clsx from "clsx";

interface Props {
    to: string;
    icon?: string;
    label: string;
    collapsed?: boolean;
    sub?: boolean;
}

const SidebarLink = ({to, icon, label, collapsed, sub}: Props) => {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link
            to={to}
            className={clsx(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                {
                    // Estilo activo para los elementos principales
                    "bg-blue-600 text-white shadow-md": active && !sub, // Activo para enlaces principales
                    "hover:bg-blue-50 text-gray-700": !active && !sub, // Hover para enlaces principales no activos

                    // Estilo activo para submenús
                    "pl-8 text-gray-600 hover:text-blue-600 hover:bg-transparent": sub && !collapsed, // Submenú en modo expandido
                    "text-blue-600 font-medium": active && sub, // Activo para submenús

                    // En el caso de que el menú esté colapsado, centramos el icono
                    "justify-center p-3 w-full": collapsed && !sub,
                }
            )}
        >
            {icon && <i className={`fas ${icon} text-sm`}></i>} {/* Ícono de menú */}
            {!collapsed && <span className="text-sm font-medium">{label}</span>} {/* Texto del menú */}
        </Link>
    );
};

export default SidebarLink;
