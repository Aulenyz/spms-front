import clsx from "clsx";
import {Link} from "react-router-dom";

const SidebarHeader = ({collapsed}: { collapsed: boolean; onToggle: () => void }) => (
    <div
        className={clsx("relative flex items-center justify-between border-b border-gray-100 px-4 transition-all duration-300 pt-8 pb-6", collapsed ? "flex-col gap-4" : "flex-row")}>
        {/* Nombre de la app */}
        <Link to="/home" className={clsx("flex items-center transition-all duration-300", collapsed ? "flex-col" : "gap-3")}
              title="Página principal">
            <div
                className="relative flex items-center justify-center bg-blue-600 text-white rounded-2xl w-14 h-14 font-bold shadow-md"
            >
                <span className="text-lg">APP</span> {/* Aquí se puede poner el nombre de la app */}
            </div>
            {!collapsed && (
                <div className="flex flex-col leading-tight">
                    <h3 className="text-lg font-semibold text-gray-800">Mi
                        Aplicación</h3> {/* Aquí va el nombre de la app */}
                </div>
            )}
        </Link>
    </div>
);

export default SidebarHeader;
