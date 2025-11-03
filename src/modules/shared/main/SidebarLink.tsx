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
                    "bg-blue-600 text-white shadow-md": active && !sub,
                    "hover:bg-blue-50 text-gray-700": !active && !sub,

                    // Para submenús
                    "pl-8 text-gray-600 hover:text-blue-600 hover:bg-transparent":
                        sub && !collapsed,
                    "text-blue-600 font-medium": active && sub,

                    // En modo colapsado centramos de forma precisa
                    "justify-center p-3 w-full": collapsed && !sub,
                }
            )}
        >

            {icon && <i className={`fas ${icon} text-sm`}></i>}
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
        </Link>
    );
};

export default SidebarLink;
