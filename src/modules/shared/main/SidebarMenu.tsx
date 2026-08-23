import SidebarLink from "./SidebarLink";
import {CommercialCollectionModal} from "../../student/enrollment/modal/EnrollmentInscriptionModal.tsx";
import {useState} from "react";

interface Props {
    collapsed?: boolean;
}

const SidebarMenu = ({collapsed}: Props) => {
    const [showCollectionModal, setShowCollectionModal] = useState(false);

    return (
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
            {/* Dashboard Section */}
            <div className="text-xs font-semibold text-gray-500 uppercase">Dashboard</div>
            <SidebarLink to="/home" icon="fa-house" label="Dashboard" collapsed={collapsed}/>

            {/* Ventas Section */}
            <div className="text-xs font-semibold text-gray-500 uppercase mt-4">Contabilidad</div>
            {/* Botón de registro */}
            <SidebarLink icon="fa-receipt" label="Nuevo Aporte" collapsed={collapsed}
                         onClick={() => setShowCollectionModal(true)}/>
            <CommercialCollectionModal isOpen={showCollectionModal} onClose={() => setShowCollectionModal(false)}/>
            <SidebarLink to="/payments/list" icon="fa-dollar-sign" label="Listado de Pagos" collapsed={collapsed}/>

            {/* Inscripciones Section */}
            <div className="text-xs font-semibold text-gray-500 uppercase mt-4">Gestión de Estudiantes</div>
            <SidebarLink to="/enrollments/list" icon="fa-list" label="Listado de Inscripciones" collapsed={collapsed}/>
            <SidebarLink to="/students/list" icon="fa-users" label="Listado de Estudiantes" collapsed={collapsed}/>

            <div className="text-xs font-semibold text-gray-500 uppercase mt-4">Configuración académica</div>
            <SidebarLink to="/specializations/list" icon="fa-book" label="Unidades Académicas" collapsed={collapsed}/>
            {/* Agregar más secciones según sea necesario */}
        </nav>
    );
};

export default SidebarMenu;
