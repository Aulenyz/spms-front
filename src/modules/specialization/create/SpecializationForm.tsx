import {SpecializationService} from "../../../services/specialization/SpecializationService.ts";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {UseForm} from "../../../domain/types/steoreotype.ts";
import {GradeType, GradeTypeLabel, SpecializationFormValues} from "../../../domain/model/course/Course.ts";
import {yupResolver} from "@hookform/resolvers/yup";
import {SpecializationSchema} from "../../../schemas/SpecializationSchema.ts";
import {toast} from "react-toastify";
import {Form} from "../../../components/io/Form.tsx";
import {useForm} from "react-hook-form";
import {Input} from "../../../components/io/Input.tsx";
import {TextareaInput} from "../../../components/io/TextareaInput.tsx";
import {SelectInput} from "../../../components/io/SelectInput.tsx";

const specializationService: SpecializationService = SpecializationService.instance;

export const SpecializationForm = ({onSubmit}: { onSubmit?: () => void }) => {

    const navigate: NavigateFunction = useNavigate();

    const {
        register,
        handleSubmit,
        formState: {errors}
    }: UseForm<SpecializationFormValues> = useForm<SpecializationFormValues>({
        resolver: yupResolver(SpecializationSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    const doCreateSpecialization = (params: SpecializationFormValues) => {
        specializationService.create('', params)
            .then(() => {
                toast.success('Especialidad creada con exito');
                onSubmit?.();
                navigate('/specializations');
            }, () => {
                toast.error('Error creando la especialidad');
            })
    }

    return (
        <Form className="py-4" name="Specialization Form" submit={handleSubmit(doCreateSpecialization)}>
            <Input label="Nombre*"
                   placeholder="Nombre de la especialidad"
                   error={errors.name?.message}
                   {...register("name")}
            />
            {/* Descripción */}
            <TextareaInput className="mt-4"
                           label="Descripción*"
                           placeholder="Descripción de la especialidad"
                           error={errors.description?.message}
                           {...register("description")}
            />
            {/* Tipo */}
            <SelectInput className="mt-4" label="Tipo*" error={errors.type?.message}{...register("type")}>
                <option value="">Seleccione un tipo</option>
                {Object.values(GradeType).map((type) => (
                    <option key={type} value={type}>
                        {GradeTypeLabel[type]}
                    </option>
                ))}
            </SelectInput>
            {/* Botón */}
            <div className="flex justify-end absolute bottom-5 right-5">
                <button className="px-4 py-2 h-10 bg-blue-600 btn-sm text-white rounded hover:bg-blue-700">
                    Agregar <i className="fa fa-save ms-2"/>
                </button>
            </div>
        </Form>
    );
};