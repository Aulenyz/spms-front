import {UseForm} from "../../../domain/types/steoreotype.ts";
import {SendRecoverRequest} from "../../../domain/model/account/RecoverPassword.ts";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {SendRecoverPasswordSchema} from "../../../schemas/AuthSchemas.ts";
import {Input} from "../../../components/io/Input.tsx";
import {AccountRecoverService} from "../../../services/account/RecoveryService.ts";
import {toast} from "react-toastify";
import {Form} from "../../../components/io/Form.tsx";
import {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {resolveErrorPath} from "../../errors/resolveErrorPath.ts";

const recoveryService: AccountRecoverService = AccountRecoverService.instance;

export const SendRecoverSchema = () => {
    const navigate = useNavigate();
    const {register, handleSubmit, formState: {errors}}: UseForm<SendRecoverRequest> =
        useForm<SendRecoverRequest>({
            resolver: yupResolver(SendRecoverPasswordSchema),
            reValidateMode: 'onChange'
        });

    const [success, setSuccess] = useState(false);

    const doRecover = (params: SendRecoverRequest) => {
        localStorage.removeItem('token_info');
        recoveryService.send(params)
            .then(() => {
                toast.success("Correo de recuperación enviado correctamente.");
                setSuccess(true);
            }, (error) => {
                const errorPath = resolveErrorPath(error as {status?: number});
                if (errorPath) {
                    navigate(errorPath, {replace: true});
                    return;
                }
                toast.error("Error enviando correo. Verificar los datos.");
            });
    };

    return (
        <div className="flex justify-center items-center">
            {success ? (
                <div className="flex flex-col items-center rounded-lg p-2 text-center">
                    <i className="text-green-500 text-4xl mb-2 fas fa-check-circle"></i>
                    <h5 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        Correo enviado
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                        Te enviamos un mensaje con las instrucciones de acceso.
                    </p>
                    <Link
                        to={'/auth/login'}
                        className="text-blue-600 hover:underline flex items-center gap-2 font-medium"
                    >
                        <i className="fas fa-arrow-left"></i> Volver al login
                    </Link>
                </div>
            ) : (
                <Form className="auth-minimal-form" name="Recover Form"
                      submit={handleSubmit(doRecover)}>
                    <div className="flex flex-col">
                        <Input
                            label={"Nombre de Usuario"}
                            type="text"
                            {...register('username')}
                            error={errors.username?.message}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary flex justify-center">
                        <i className="fas fa-paper-plane mr-2"></i> Enviar
                    </button>
                </Form>
            )}
        </div>
    );
};
