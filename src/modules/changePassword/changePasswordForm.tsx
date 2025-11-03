import {ChangePasswordService} from "../../services/account/ChangePasswordService.ts";
import {UseForm} from "../../domain/types/steoreotype.ts";
import {ChangePassword} from "../../domain/model/account/ChangePassword.ts";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {Form} from "../../components/io/Form.tsx";
import {PasswordInput} from "../../components/io/PasswordInput.tsx";
import {changePasswordSchema} from "../../contexts/changePassword/changePasswordSchema.ts";

const changePasswordService: ChangePasswordService = ChangePasswordService.instance;
export const ChangePasswordForm = ({onSubmit}: { onSubmit?: () => void }) => {

    const navigate: NavigateFunction = useNavigate();

    const {register, handleSubmit, formState: {errors}}: UseForm<ChangePassword> = useForm<ChangePassword>({
        resolver: yupResolver(changePasswordSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    const doChangePassword = (params: ChangePassword) => {
        changePasswordService.create(params)
            .then(() => {
                toast.success('Contraseña cambiada con exito');
                onSubmit?.();
                navigate('/home');
            }, () => {
                toast.error('Error cambiando la Contraseña');
            })
    }

    return (
        <Form className={'py-2'} name="Login Form" submit={handleSubmit(doChangePassword)}>

            <PasswordInput className={'mb-5'} label={'Contraseña Actual'}
                           type="password"{...register('currentPassword')} error={errors.currentPassword?.message}/>
            <PasswordInput className={'mb-5'} label={'Nueva Contraseña'} type="password"{...register('newPassword')}
                           error={errors.newPassword?.message}/>
            <PasswordInput className={'mb-5'} label={'Confirmar Contraseña'}
                           type="password"{...register('confirmPassword')} error={errors.confirmPassword?.message}/>

            <div className="flex justify-end absolute bottom-5 right-5">
                <button className="px-4 py-2 h-10 bg-blue-600 btn-sm text-white rounded hover:bg-blue-700">
                    Restablecer Contraseña <i className="fa fa-key ms-2"/>
                </button>
            </div>
        </Form>
    )
}