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

const recoveryService: AccountRecoverService = AccountRecoverService.instance;
export const RecoverPasswordSchema = () => {
    const navigate: NavigateFunction = useNavigate();
    const {token}: Record<string, string> = useQueryParams();
    const [loading, setLoading]: State<boolean> = useState<boolean>();
    const {register, handleSubmit, formState: {errors}, setValue}: UseForm<RecoverPassword> = useForm<RecoverPassword>({
        resolver: yupResolver(RecoverSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    useEffect(() => {
        setValue('token', token);
    }, [token]);

    const doRecoverPassword = (params: RecoverPassword) => {
        setLoading(true);
        recoveryService.create(params)
            .then(() => {
                toast.success("Password Cambiada con exito.");
                navigate('/auth/login', {replace: true});
            }, () => {
                toast.error("Error cambiando Password.");
            })

    };
    return (
        <Form className="card-body flex flex-col gap-5 p-10" name="Login Form" submit={handleSubmit(doRecoverPassword)}>
            <div className="text-center mb-2.5">
                <h3 className="text-lg font-medium text-gray-900 leading-none mt-2.5">
                    Cambiar Contraseña
                </h3>
            </div>
            <div className="flex flex-col">
                <Input label={'Nueva Contraseña'} type="password"
                       {...register('password')}
                       error={errors.password?.message}/>
            </div>
            <div className="flex flex-col mt-2">
                <Input label={'Repetir Contraseña'} type="password"
                       {...register('repeated')}
                       error={errors.repeated?.message}/>
            </div>
            <button className="btn btn-primary flex justify-center grow">
                Restablecer Contraseña
                {loading && <i className="fa fa-spin fa-spinner"/>}
            </button>
        </Form>
    )
}