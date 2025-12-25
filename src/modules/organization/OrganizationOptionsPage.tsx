import {Link, Outlet, useLocation} from "react-router-dom";

export const OrganizationOptionsPage = () => {
    const location = useLocation();

    const isTemplates = location.pathname === "/courses/templates";

    return (
        <div className="pt-6 pl-9 pr-5">
            <div className="mb-4 border-b border-gray-200">
                <div className="flex gap-6 text-sm font-medium">
                    <Link to="/courses/templates"
                          className={`pb-2 inline-flex items-center ${isTemplates ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}>
                        <i className="fa fa-users mr-2"/>
                        Plantillas de Cursos
                    </Link>
                </div>
            </div>
            <Outlet/>
        </div>
    );
};
