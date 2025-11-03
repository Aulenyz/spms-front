import {yupResolver} from '@hookform/resolvers/yup';
import {useForm} from 'react-hook-form';
import {AuthContextValue, useAuthContext} from '../../contexts/AuthContext.tsx';
import {UseForm} from '../../domain/types/steoreotype.ts';
import {UserPasswordLogin} from '../../domain/model/auth/Login.ts';
import {LoginSchema} from '../../schemas/AuthSchemas.ts';
import {Input} from '../../components/io/Input.tsx';
import {Form} from "../../components/io/Form.tsx";
import {Link} from "react-router-dom";
import {ErrorMessage} from "../../components/io/output/ErrorMessage.tsx";

export const LoginForm = () => {

    const {authenticate, message, loading}: AuthContextValue = useAuthContext();
    const {register, handleSubmit, formState: {errors}}: UseForm<UserPasswordLogin> = useForm<UserPasswordLogin>({
        resolver: yupResolver(LoginSchema),
        reValidateMode: 'onChange'
    });

    return (
        <Form
            className="card-body flex flex-col gap-4 p-6"
            name="Login Form"
            submit={handleSubmit(authenticate)}
        >
            {/* Campo: Usuario */}
            <div className="flex flex-col">
                <Input
                    label="Usuario / Documento"
                    type="text"
                    {...register("username")}
                    error={errors.username?.message}
                />
            </div>

            {/* Campo: Contraseña */}
            <div className="flex flex-col">
                <Input
                    label="Contraseña"
                    type="password"
                    {...register("password")}
                    error={errors.password?.message}
                />
            </div>

            <button className="btn btn-primary flex justify-center grow">
                INICIAR SESIÓN
                {loading && <i className="fa fa-spin fa-spinner"/>}
            </button>

            <Link to="/auth/send-recover"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center justify-center gap-2 transition-colors mt-1">
                <i className="fa fa-unlock-alt text-blue-500"></i>
                Recuperar contraseña
            </Link>

            <ErrorMessage message={message}/>
        </Form>
    );
};
