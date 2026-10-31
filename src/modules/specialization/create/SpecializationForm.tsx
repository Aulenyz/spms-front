import {SpecializationService} from "../../../services/specialization/SpecializationService.ts";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {UseForm} from "../../../domain/types/steoreotype.ts";
import {GradeType, GradeTypeLabel, SpecializationFormValues} from "../../../domain/model/course/Course.ts";
import {yupResolver} from "@hookform/resolvers/yup";
import {SpecializationSchema} from "../../../schemas/SpecializationSchema.ts";
import {toast} from "react-toastify";
import {Form} from "../../../components/io/Form.tsx";
import {useForm, useWatch} from "react-hook-form";
import {useCallback, useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {AssistantService} from "../../../services/assistant/AssistantService.ts";
import {useDebouncedValue} from "../../../hooks/useDebouncedValue.ts";
import {Input} from "../../../components/io/Input.tsx";
import {TextareaInput} from "../../../components/io/TextareaInput.tsx";
import {SelectInput} from "../../../components/io/SelectInput.tsx";

const specializationService: SpecializationService = SpecializationService.instance;

export const SpecializationForm = ({onSubmit}: { onSubmit?: () => void }) => {

    const navigate: NavigateFunction = useNavigate();

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: {errors}
    }: UseForm<SpecializationFormValues> = useForm<SpecializationFormValues>({
        resolver: yupResolver(SpecializationSchema),
        defaultValues: {},
        reValidateMode: 'onChange'
    });

    // La IA propone la descripción a partir del nombre, hasta que el usuario la escriba a mano.
    const {data: assistant} = useQuery({
        queryKey: ["assistant", "status"],
        queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(),
        staleTime: Infinity,
        meta: {silent: true},
    });
    const [name, type] = useWatch({control, name: ["name", "type"]});
    const debouncedName = useDebouncedValue((name ?? "").trim(), 900);
    const [manual, setManual] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [suggested, setSuggested] = useState(false);
    const canSuggest = Boolean(assistant?.enabled) && debouncedName.length >= 4;

    const suggest = useCallback(async (force = false) => {
        if (!canSuggest || (manual && !force)) return;
        setSuggesting(true);
        try {
            const {description} = await AssistantService.instance
                .describe("specialization", debouncedName, type ? GradeTypeLabel[type as GradeType] : undefined);
            setValue("description", description, {shouldValidate: true, shouldDirty: true});
            setManual(false);
            setSuggested(true);
        } catch {
            // Si la IA no responde, la descripción se escribe a mano.
        } finally {
            setSuggesting(false);
        }
    }, [canSuggest, manual, debouncedName, type, setValue]);

    useEffect(() => {
        void suggest();
        // Solo cuando cambia el nombre ya escrito (no al cambiar `manual`).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedName]);

    const descriptionField = register("description", {onChange: () => setManual(true)});

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
                           placeholder={assistant?.enabled ? "Escribe el nombre y la IA sugiere la descripción" : "Descripción de la especialidad"}
                           error={errors.description?.message}
                           {...descriptionField}
            />
            <div className="mt-1 min-h-[1.5rem]">{assistant?.enabled && (
                <div className="flex items-center justify-between gap-3 text-xs" style={{color: "var(--text-tertiary)"}}>
                    <span>
                        {suggesting
                            ? <><i className="fa fa-spinner fa-spin me-1"/>La IA está escribiendo la descripción…</>
                            : suggested && !manual
                                ? <><i className="fa fa-wand-magic-sparkles me-1" style={{color: "var(--accent)"}}/>Sugerida por IA; puedes editarla.</>
                                : null}
                    </span>
                    <button type="button" className="btn btn-ghost btn-xs" disabled={!canSuggest || suggesting}
                            onClick={() => void suggest(true)}>
                        <i className="fa fa-wand-magic-sparkles"/>{suggested ? "Otra sugerencia" : "Sugerir con IA"}
                    </button>
                </div>
            )}</div>
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