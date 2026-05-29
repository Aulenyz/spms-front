import {ErrorScreen} from "./ErrorScreen.tsx";

export const Error404 = () => {
    return (
        <ErrorScreen
            code="404"
            title="Página no encontrada"
            icon="fa-compass-drafting"
            message="La ruta que intentas abrir no existe o ya no está disponible."
            hint="Verifica la dirección o vuelve a una sección principal del sistema para continuar."
            actions={[
                {label: "Ir al inicio", to: "/home"},
            ]}
        />
    );
};
