import {SendRecoverSchema} from "./SendRecoverPasswordForm.tsx";
import {AuthShell} from "../../../components/ui/layout/AuthShell.tsx";

export const SendRecoverPasswordPage = () => {
    return (
        <AuthShell
            title="Recuperar contrasena"
            description="Escribe tu usuario para recibir instrucciones de acceso."
            accentTitle="Recupera tu acceso a Aulenyx sin salir del flujo principal del campus."
            variant="recover"
            backTo="/auth/login"
            backLabel="Volver"
            form={<SendRecoverSchema/>}
        />
    );
};
