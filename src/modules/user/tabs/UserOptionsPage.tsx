import { Link, Outlet, useLocation } from "react-router-dom";

export const UserOptionsPage = () => {
    const location = useLocation();

    const isUsers = location.pathname === "/users";
    const isRoles = location.pathname === "/users/roles";
    const isAuthorities = location.pathname === "/users/authorities";

    return (
        <div className="pt-6 pl-9 pr-5">
            <div className="mb-4 border-b border-gray-200">
                <div className="flex gap-6 text-sm font-medium">
                    <Link to="/users" className={`pb-2 inline-flex items-center ${isUsers ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                        <i className="fa fa-users mr-2" />
                        Usuarios
                    </Link>
                    <Link to="/users/roles" className={`pb-2 inline-flex items-center ${isRoles ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                        <i className="fa fa-lock mr-2" />
                        Roles de Usuario
                    </Link>
                    <Link to="/users/authorities" className={`pb-2 inline-flex items-center ${isAuthorities ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                        <i className="fa fa-lock mr-2" />
                        Variables del Sistema
                    </Link>
                </div>
            </div>
            <Outlet />
        </div>
    );
};
