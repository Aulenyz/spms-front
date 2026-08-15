import {LoginForm} from "./LoginForm.tsx";
import {AuthShell} from "../../components/ui/layout/AuthShell.tsx";

export const LoginPage = () => {
    return (
        <AuthShell
            title="Iniciar sesion"
            description="Accede con tu usuario y contrasena."
            variant="login"
            form={<LoginForm/>}
        />
    );
};
