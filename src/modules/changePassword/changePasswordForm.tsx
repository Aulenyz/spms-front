import {ChangePasswordService} from "../../services/account/ChangePasswordService.ts";
import {UseForm} from "../../domain/types/steoreotype.ts";
import {ChangePassword} from "../../domain/model/account/ChangePassword.ts";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {PasswordInput} from "../../components/io/PasswordInput.tsx";
import {changePasswordSchema} from "../../contexts/changePassword/changePasswordSchema.ts";
import {useState} from "react";

const changePasswordService: ChangePasswordService = ChangePasswordService.instance;
export const ChangePasswordForm = ({onSubmit}: { onSubmit?: () => void }) => {

    const navigate: NavigateFunction = useNavigate();
    const [saving, setSaving] = useState(false);

    const {register, handleSubmit, formState: {errors}}: UseForm<ChangePassword> = useForm<ChangePassword>({
        resolver: yupResolver(changePasswordSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    const doChangePassword = (params: ChangePassword) => {
        if (saving) return;
        setSaving(true);
        changePasswordService
            .create('', params)
            .then(() => {
                toast.success('Contrasena cambiada con exito');
                onSubmit?.();
                navigate('/home');
            }, () => {
                toast.error('Error cambiando la contrasena');
            })
            .finally(() => setSaving(false));
    }

    return (
        <form className="space-y-5 p-4" name="ChangePasswordForm" onSubmit={handleSubmit(doChangePassword)}>
            <div className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>
                    Seguridad
                </div>
                <div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Actualiza tu contrasena para mantener tu cuenta protegida.
                </div>
            </div>

            <div className="grid gap-4">
                <PasswordInput
                    label={'Contrasena actual'}
                    type="password"
                    {...register('currentPassword')}
                    error={errors.currentPassword?.message}
                />
                <PasswordInput
                    label={'Nueva contrasena'}
                    type="password"
                    {...register('newPassword')}
                    error={errors.newPassword?.message}
                />
                <PasswordInput
                    label={'Confirmar contrasena'}
                    type="password"
                    {...register('confirmPassword')}
                    error={errors.confirmPassword?.message}
                />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                    {saving ? "Guardando..." : "Cambiar contrasena"}
                    <i className="fa fa-key ms-2"/>
                </button>
            </div>
        </form>
    )
}
