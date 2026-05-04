import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {ErrorScreen} from "./ErrorScreen.tsx";

export const Error403 = () => {
    const {logout} = useAuthContext();

    return (
        <ErrorScreen
            code="403"
            title="Acceso restringido"
            icon="fa-shield-halved"
            message="Tu usuario no tiene permisos para entrar en esta sección."
            hint="Ponte en contacto con un administrador para revisar los permisos asignados a tu rol o el espacio de trabajo seleccionado."
            actions={[
                {label: "Cambiar espacio de trabajo", to: "/auth/select-organization"},
                {label: "Cerrar sesión", onClick: () => logout?.(), variant: "light"},
            ]}
        />
    );
};
