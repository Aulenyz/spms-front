import {NavigateFunction, useNavigate} from "react-router-dom";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {Controller, useForm} from "react-hook-form";
import {UserInvitationService} from "../../../../services/user/UserInvitationService.ts";
import {UseForm} from "../../../../domain/types/steoreotype.ts";
import {UserInvitationFormValues} from "../../../../domain/model/user/user.ts";
import {UserInvitationSchema} from "../../../../schemas/UserInvitationSchema.ts";
import {Form} from "../../../../components/io/Form.tsx";
import {Input} from "../../../../components/io/Input.tsx";
import {RoleSelect} from "../../../../components/io/input/business/RoleSelect.tsx";

const userInvitationService: UserInvitationService = UserInvitationService.instance;

export const UserInvitationForm = ({onSubmit}: { onSubmit?: () => void }) => {
    const navigate: NavigateFunction = useNavigate();

    const {
        control,
        register,
        handleSubmit,
        setError,
        formState: {errors}
    }: UseForm<UserInvitationFormValues> = useForm<UserInvitationFormValues>({
        resolver: yupResolver(UserInvitationSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    const doSendInvitation = async (params: UserInvitationFormValues) => {
        const exists = await userInvitationService.existsByEmail(params.email);
        if (exists) {
            setError("email", {type: "manual", message: "Este correo ya fue invitado"});
            return;
        }
        userInvitationService.create('/send', params)
            .then(() => {
                toast.success('Invitación enviada con exito');
                onSubmit?.();
                navigate('/users/invitations');
            }, () => {
                toast.error('Error enviando la invitación');
            })
    }

    return (
        <Form className="py-4" name="User Invitation Form" submit={handleSubmit(doSendInvitation)}>
            {/* Email */}
            <Input
                label="Email*"
                placeholder="correo@ejemplo.com"
                error={errors.email?.message}
                {...register("email")}
            />

            <Controller
                name="roleId"
                control={control}
                render={({field}) => (
                    <RoleSelect
                        text="Selecciona el Rol"
                        label="Rol"
                        {...field}
                        required
                        value={field.value}
                        className="mt-4"
                        control={control}
                    />
                )}
            />
            {/* Botón */}
            <div className="flex justify-end absolute bottom-5 right-5">
                <button className="px-4 py-2 h-10 bg-blue-600 btn-sm text-white rounded hover:bg-blue-700">
                    Enviar <i className="fa fa-paper-plane ms-2"/>
                </button>
            </div>
        </Form>
    );
};