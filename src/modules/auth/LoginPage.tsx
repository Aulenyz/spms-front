import {LoginForm} from "./LoginForm.tsx";
import {AuthShell} from "../../components/ui/layout/AuthShell.tsx";

export const LoginPage = () => {
    return (
        <AuthShell
            title="Iniciar sesion"
            description="Accede con tu usuario y contrasena."
            accentTitle="Entra a Aulenyx para gestionar matricula, cobros escolares y operaciones del campus."
            variant="login"
            form={<LoginForm/>}
        />
    );
};
