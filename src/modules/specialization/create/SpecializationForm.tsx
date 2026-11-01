import {SpecializationService} from "../../../services/specialization/SpecializationService.ts";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {UseForm} from "../../../domain/types/steoreotype.ts";
import {GradeType, GradeTypeLabel, Specialization, SpecializationFormValues} from "../../../domain/model/course/Course.ts";
import {yupResolver} from "@hookform/resolvers/yup";
import {SpecializationSchema} from "../../../schemas/SpecializationSchema.ts";
import {toast} from "react-toastify";
import {Form} from "../../../components/io/Form.tsx";
import {useForm, useWatch} from "react-hook-form";
import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {AssistantService} from "../../../services/assistant/AssistantService.ts";
import {Input} from "../../../components/io/Input.tsx";
import {TextareaInput} from "../../../components/io/TextareaInput.tsx";
import {SelectInput} from "../../../components/io/SelectInput.tsx";

const specializationService: SpecializationService = SpecializationService.instance;

/** Crea un área o, con `specialization`, la edita. */
export const SpecializationForm = ({specialization, onSubmit, onCancel}: { specialization?: Specialization; onSubmit?: () => void; onCancel?: () => void }) => {

    const navigate: NavigateFunction = useNavigate();
    const editing = Boolean(specialization?.id);
    const [saving, setSaving] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: {errors}
    }: UseForm<SpecializationFormValues> = useForm<SpecializationFormValues>({
        resolver: yupResolver(SpecializationSchema),
        defaultValues: specialization
            ? {name: specialization.name ?? "", description: specialization.description ?? "", type: specialization.type}
            : {},
        reValidateMode: 'onChange'
    });

    // La IA escribe la descripción a partir del nombre solo cuando se pulsa el botón.
    const {data: assistant} = useQuery({
        queryKey: ["assistant", "status"],
        queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(),
        staleTime: Infinity,
        meta: {silent: true},
    });
    const [name, type] = useWatch({control, name: ["name", "type"]});
    const trimmedName = (name ?? "").trim();
    const [manual, setManual] = useState(false);
    const [suggesting, setSuggesting] = useState(false);
    const [suggested, setSuggested] = useState(false);
    const canSuggest = Boolean(assistant?.enabled) && trimmedName.length >= 4;

    const suggest = async () => {
        if (!canSuggest) return;
        setSuggesting(true);
        try {
            const {description} = await AssistantService.instance
                .describe("specialization", trimmedName, type ? GradeTypeLabel[type as GradeType] : undefined);
            setValue("description", description, {shouldValidate: true, shouldDirty: true});
            setManual(false);
            setSuggested(true);
        } catch {
            // Si la IA no responde, la descripción se escribe a mano.
        } finally {
            setSuggesting(false);
        }
    };

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

    const doUpdateSpecialization = async (params: SpecializationFormValues) => {
        if (!specialization?.id) return;
        setSaving(true);
        try {
            await specializationService.update(specialization.id, params);
            toast.success('Área actualizada');
            onSubmit?.();
        } catch (error) {
            toast.error((error as {message?: string})?.message ?? 'No se pudo actualizar el área');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Form className="py-4" name="Specialization Form" submit={handleSubmit(editing ? doUpdateSpecialization : doCreateSpecialization)}>
            <Input label="Nombre*"
                   placeholder="Nombre de la especialidad"
                   error={errors.name?.message}
                   {...register("name")}
            />
            {/* Descripción */}
            <div className="mt-4 flex items-start gap-2">
                <TextareaInput className="min-w-0 flex-1"
                               label="Descripción*"
                               rows={4}
                               placeholder={assistant?.enabled ? "Escríbela o pulsa el botón para que la IA la sugiera" : "Descripción de la especialidad"}
                               error={errors.description?.message}
                               {...descriptionField}
                />
                {assistant?.enabled ? (
                    <button type="button" className="btn btn-sm btn-square mt-8 shrink-0" disabled={!canSuggest || suggesting}
                            title={suggested ? "Otra sugerencia con IA" : "Sugerir con IA"} aria-label="Sugerir descripción con IA"
                            onClick={() => void suggest()}>
                        <i className={`fa ${suggesting ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} style={{color: "var(--accent)"}}/>
                    </button>
                ) : <span/>}
            </div>
            <p className="mt-1 min-h-[1.25rem] text-xs" style={{color: "var(--text-tertiary)"}}>
                {suggesting
                    ? "La IA está escribiendo la descripción…"
                    : suggested && !manual ? "Sugerida por IA; puedes editarla." : ""}
            </p>
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
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                {onCancel ? (
                    <button type="button" className="btn btn-sm" onClick={onCancel} disabled={saving}>Cancelar</button>
                ) : <span/>}
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                    <i className={`fa ${saving ? "fa-spinner fa-spin" : "fa-save"} ms-2`}/>
                </button>
            </div>
        </Form>
    );
};