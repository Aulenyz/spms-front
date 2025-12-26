import {NavigateFunction, useNavigate} from "react-router-dom";
import {yupResolver} from "@hookform/resolvers/yup";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {UseForm} from "../../../../domain/types/steoreotype.ts";
import {AuthorityFormValues} from "../../../../domain/model/user/user.ts";
import {Form} from "../../../../components/io/Form.tsx";
import {Input} from "../../../../components/io/Input.tsx";
import {TextareaInput} from "../../../../components/io/TextareaInput.tsx";
import {AuthoritySchema} from "../../../../schemas/AuthoritySchema.ts";
import {AuthorityService} from "../../../../services/user/AuthorityService.ts";

const authorityService: AuthorityService = AuthorityService.instance;

export const AuthorityForm = ({onSubmit}: { onSubmit?: () => void }) => {
    const navigate: NavigateFunction = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: {errors}
    }: UseForm<AuthorityFormValues> = useForm<AuthorityFormValues>({
        resolver: yupResolver(AuthoritySchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    const doSend = async (params: AuthorityFormValues) => {
        if (await authorityService.existsByName(params.name))
            return setError('name', {message: 'El nombre de la variable ya existe'});
        if (await authorityService.existsByKey(params.key))
            return setError('key', {message: 'La llave de la variable ya existe'});
        authorityService.create('', params)
            .then(() => {
                toast.success('Variable creada con exito');
                onSubmit?.();
                navigate('/users/authorities');
            }, () => {
                toast.error('Error creando la variable');
            })
    }

    return (
        <Form className="py-4" name="Authority Form" submit={handleSubmit(doSend)}>
            <Input
                label="Nombre*"
                placeholder="Nombre de la Variable"
                error={errors.name?.message}
                {...register("name")}
            />
            <Input
                label="Llave*"
                placeholder="Llave de la Variable"
                error={errors.key?.message}
                {...register("key")}
            />
            <TextareaInput className="mt-4"
                           label="Descripción*"
                           placeholder="Descripción de la Variable"
                           error={errors.description?.message}
                           {...register("description")}
            />
            {/* Botón */}
            <div className="flex justify-end absolute bottom-5 right-5">
                <button className="px-4 py-2 h-10 bg-blue-600 btn-sm text-white rounded hover:bg-blue-700">
                    Agregar <i className="fa fa-add ms-2"/>
                </button>
            </div>
        </Form>
    );
};