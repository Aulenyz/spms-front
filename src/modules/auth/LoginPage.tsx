import {LoginForm} from "./LoginForm.tsx";
import {AuthShell} from "../../components/ui/layout/AuthShell.tsx";

export const LoginPage = () => {
    return (
        <AuthShell
            title="Iniciar sesión"
            description="Accede con tu usuario y contraseña."
            variant="login"
            form={<LoginForm/>}
        />
    );
};
