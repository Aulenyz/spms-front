import {Navigate, useSearchParams} from "react-router-dom";
import {useEffect, useState} from "react";

import {AuthShell} from "../../components/ui/layout/AuthShell.tsx";
import {PublicUserService} from "../../services/public/PublicUserService.ts";
import {RegisterInvitationForm} from "./RegisterInvitationForm.tsx";

const publicUserService = PublicUserService.instance;

export const RegisterInvitationPage = () => {
    const [params] = useSearchParams();
    const token = params.get("token")?.trim() ?? "";
    const [validating, setValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        if (!token) {
            setValidating(false);
            setIsValid(false);
            return;
        }

        publicUserService.tokenIsValid(token)
            .then((valid) => setIsValid(Boolean(valid)))
            .catch(() => setIsValid(false))
            .finally(() => setValidating(false));
    }, [token]);

    if (!token) return <Navigate to="/auth/login" replace/>;
    if (validating) {
        return (
            <AuthShell
                title="Validando invitacion"
                description="Estamos verificando el enlace antes de mostrar el registro."
                accentTitle="Preparamos el acceso publico para que completes tu perfil institucional."
                variant="login"
                form={
                    <div className="auth-minimal-form">
                        <div className="rounded-[22px] border p-5 text-sm font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                            <div className="flex items-center justify-center gap-3">
                                <i className="fa fa-spinner fa-spin"/>
                                <span>Validando token de invitacion...</span>
                            </div>
                        </div>
                    </div>
                }
            />
        );
    }

    if (!isValid) return <Navigate to="/auth/login" replace/>;

    return (
        <AuthShell
            title="Completar registro"
            description="Crea tu acceso con la invitacion recibida."
            accentTitle="Activa tu cuenta institucional, sube tu foto y configura tus credenciales para entrar al campus."
            variant="login"
            form={<RegisterInvitationForm token={token}/>}
        />
    );
};
