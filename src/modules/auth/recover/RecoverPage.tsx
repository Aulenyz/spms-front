import {RecoverPasswordSchema} from "./RecoverForm.tsx";
import {AuthShell} from "../../../components/ui/layout/AuthShell.tsx";

export const RecoverPage = () => {
    return (
        <AuthShell
            title="Restablecer contrasena"
            description="Define una nueva contrasena para volver a entrar."
            accentTitle="Completa el cambio y vuelve a Aulenyx con una credencial nueva."
            variant="reset"
            backTo="/auth/login"
            backLabel="Volver"
            form={<RecoverPasswordSchema/>}
        />
    );
};
