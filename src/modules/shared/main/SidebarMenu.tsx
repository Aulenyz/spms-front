import SidebarLink from "./SidebarLink";

interface Props {
    collapsed?: boolean;
}

const SidebarMenu = ({collapsed}: Props) => {
    return (
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
            {/* Dashboard Section */}
            <div className="text-xs font-semibold text-gray-500 uppercase">Dashboard</div>
            <SidebarLink to="/home" icon="fa-house" label="Dashboard" collapsed={collapsed} />

            {/* Inscripciones Section */}
            <div className="text-xs font-semibold text-gray-500 uppercase mt-4">Gestion de Estudiantes</div>
            <SidebarLink to="/enrollments/list" icon="fa-list" label="Listado de Inscripciones" collapsed={collapsed} />
            <SidebarLink to="/students/list" icon="fa-users" label="Listado de Estudiantes" collapsed={collapsed} />

            {/* Ventas Section */}
            <div className="text-xs font-semibold text-gray-500 uppercase mt-4">Contabilidad</div>
            <SidebarLink to="/payments/list" icon="fa-dollar-sign" label="Listado de Ventas" collapsed={collapsed} />

            {/* Agregar más secciones según sea necesario */}
        </nav>
    );
};

export default SidebarMenu;
