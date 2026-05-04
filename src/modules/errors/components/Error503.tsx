import {ErrorScreen} from "./ErrorScreen.tsx";

export const Error503 = () => {
    return (
        <ErrorScreen
            code="503"
            title="No pudimos conectar con el sistema"
            icon="fa-server"
            message="No fue posible cargar la información en este momento."
            hint="Puede tratarse de una caída temporal del servicio, un problema de red o un bloqueo de acceso del navegador. Si persiste, ponte en contacto con un administrador."
            actions={[
                {label: "Reintentar", onClick: () => window.location.reload()},
                {label: "Ir al login", to: "/auth/login", variant: "light"},
            ]}
        />
    );
};
