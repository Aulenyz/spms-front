import {NavigateFunction, useNavigate} from "react-router-dom";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {UseForm} from "../../../../domain/types/steoreotype.ts";
import {RoleFormValues} from "../../../../domain/model/user/user.ts";
import {Form} from "../../../../components/io/Form.tsx";
import {Input} from "../../../../components/io/Input.tsx";
import {RoleService} from "../../../../services/user/RoleService.ts";
import {RoleSchema} from "../../../../schemas/RoleSchema.ts";
import {TextareaInput} from "../../../../components/io/TextareaInput.tsx";

const roleService: RoleService = RoleService.instance;

export const RoleForm = ({onSubmit}: { onSubmit?: () => void }) => {
    const navigate: NavigateFunction = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: {errors}
    }: UseForm<RoleFormValues> = useForm<RoleFormValues>({
        resolver: yupResolver(RoleSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    const doSend = async (params: RoleFormValues) => {
        const exists = await roleService.existsByName(params.name);
        if (exists) {
            setError('name', {type: 'manual', message: 'El nombre del rol ya existe'});
            return;
        }
        roleService.create('', params)
            .then(() => {
                toast.success('Rol creado con exito');
                onSubmit?.();
                navigate('/users/roles');
            }, () => {
                toast.error('Error creando el rol');
            })
    }

    return (
        <Form className="py-4" name="User Role Form" submit={handleSubmit(doSend)}>
            <Input
                label="Nombre*"
                placeholder="Nombre del Rol"
                error={errors.name?.message}
                {...register("name")}
            />

            <TextareaInput className="mt-4"
                           label="Descripción*"
                           placeholder="Descripción del Rol"
                           error={errors.description?.message}
                           {...register("description")}
            />

            {/* Botón */}
            <div className="flex justify-end absolute bottom-5 right-5">
                <button className="px-4 py-2 h-10 bg-blue-600 btn-sm text-white rounded hover:bg-blue-700">
                    Agregar <i className="fa fa-paper-plane ms-2"/>
                </button>
            </div>
        </Form>
    );
};