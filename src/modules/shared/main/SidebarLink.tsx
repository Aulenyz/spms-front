import {Link, useLocation} from "react-router-dom";
import clsx from "clsx";

interface Props {
    to?: string;
    icon?: string;
    label: string;
    collapsed?: boolean;
    sub?: boolean;
    onClick?: () => void;
}

const SidebarLink = ({to, icon, label, collapsed, sub, onClick}: Props) => {
    const location = useLocation();
    const active = to ? location.pathname === to : false;

    const className = clsx(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full",
        {
            "bg-blue-600 text-white shadow-md": active && !sub,
            "hover:bg-blue-50 text-gray-700": !active && !sub,
            "pl-8 text-gray-600 hover:text-blue-600 hover:bg-transparent": sub && !collapsed,
            "text-blue-600 font-medium": active && sub,
            "justify-center p-3": collapsed && !sub,
        }
    );

    if (onClick) {
        return (
            <button onClick={onClick} className={className}>
                {icon && <i className={`fas ${icon} text-sm`}/>}
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </button>
        );
    }

    return (
        <Link to={to!} className={className}>
            {icon && <i className={`fas ${icon} text-sm`}/>}
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
        </Link>
    );
};

export default SidebarLink;
