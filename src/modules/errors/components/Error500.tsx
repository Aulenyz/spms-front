import {ErrorScreen} from "./ErrorScreen.tsx";

export const Error500 = () => {
    return (
        <ErrorScreen
            code="500"
            title="Problema interno del sistema"
            icon="fa-triangle-exclamation"
            message="Ocurrió un error mientras intentábamos procesar la solicitud."
            hint="Intenta nuevamente en unos minutos. Si el problema continúa, contacta a un administrador para revisar el servicio."
            actions={[
                {label: "Reintentar", onClick: () => window.location.reload()},
                {label: "Ir al inicio", to: "/home", variant: "light"},
            ]}
        />
    );
};
