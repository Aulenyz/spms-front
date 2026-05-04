import {yupResolver} from '@hookform/resolvers/yup';
import {useForm} from 'react-hook-form';
import {RecoverSchema} from "../../../schemas/AuthSchemas.ts";
import {State, UseForm} from "../../../domain/types/steoreotype.ts";
import {Form} from "../../../components/io/Form.tsx";
import {Input} from "../../../components/io/Input.tsx";
import {useEffect, useState} from "react";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";
import {RecoverPassword} from "../../../domain/model/account/RecoverPassword.ts";
import {AccountRecoverService} from "../../../services/account/RecoveryService.ts";
import {toast} from "react-toastify";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {resolveErrorPath} from "../../errors/resolveErrorPath.ts";

const recoveryService: AccountRecoverService = AccountRecoverService.instance;
export const RecoverPasswordSchema = () => {
    const navigate: NavigateFunction = useNavigate();
    const {token}: Record<string, string> = useQueryParams();
    const [loading, setLoading]: State<boolean> = useState<boolean>();
    const {register, handleSubmit, formState: {errors}, setValue}: UseForm<RecoverPassword> = useForm<RecoverPassword>({
        resolver: yupResolver(RecoverSchema),
        reValidateMode: 'onChange'
    });

    useEffect(() => {
        setValue('token', token);
    }, [token]);

    const doRecoverPassword = (params: RecoverPassword) => {
        setLoading(true);
        recoveryService.create('', params)
            .then(() => {
                toast.success("Contrasena actualizada.");
                navigate('/auth/login', {replace: true});
            }, (error) => {
                const errorPath = resolveErrorPath(error as {status?: number});
                if (errorPath) {
                    navigate(errorPath, {replace: true});
                    return;
                }
                toast.error("No se pudo actualizar la contrasena.");
            })

    };
    return (
        <Form className="auth-minimal-form" name="Login Form" submit={handleSubmit(doRecoverPassword)}>
            <div className="flex flex-col">
                <Input label={'Nueva contrasena'} type="password"
                       {...register('password')}
                       error={errors.password?.message}/>
            </div>
            <div className="flex flex-col mt-2">
                <Input label={'Repetir contrasena'} type="password"
                       {...register('repeated')}
                       error={errors.repeated?.message}/>
            </div>
            <button className="btn btn-primary flex justify-center grow">
                Restablecer contrasena
                {loading && <i className="fa fa-spin fa-spinner"/>}
            </button>
        </Form>
    )
}
