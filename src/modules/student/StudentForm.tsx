import {yupResolver} from "@hookform/resolvers/yup";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {toast} from "react-toastify";
import {Gender, Genders} from "../../domain/model/user/user.ts";
import {StudentFormValues} from "../../domain/student/Student.ts";
import {StudentSchema} from "../../schemas/StudentSchema.ts";
import {StudentService} from "../../services/student/StudentService.ts";
import {DatePicker} from "../../components/io/DatePicker.tsx";

const studentService = StudentService.instance;

export const StudentForm = ({
                                onDone,
                                onSaved,
                            }: {
    onDone: () => void;
    onSaved?: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: {errors, isValid},
    } = useForm<StudentFormValues>({
        resolver: yupResolver(StudentSchema),
        defaultValues: {
            firstname: "",
            lastname: "",
            gender: undefined as unknown as Gender,
            birthDate: "",
        },
        mode: "onChange",
    });
    const birthDate = watch("birthDate");

    const submit = async (values: StudentFormValues) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const payload: StudentFormValues = {
                firstname: values.firstname.trim(),
                lastname: values.lastname.trim(),
                gender: values.gender,
                birthDate: values.birthDate,
            };

            await studentService.createStudent(payload);
            toast.success("Estudiante registrado correctamente.");
            reset();
            onSaved?.();
            onDone();
        } catch (error) {
            const message = (error as {message?: string})?.message;
            toast.error(message?.trim() || "No se pudo registrar el estudiante.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4"
            onSubmit={handleSubmit(submit)}
        >
            <div
                className="rounded-[20px] border px-4 py-3"
                style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
            >
                <div className="flex items-start gap-3">
                    <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                    >
                        <i className="fa fa-user-plus"/>
                    </span>
                    <div>
                        <p
                            className="text-xs font-semibold uppercase tracking-[0.16em]"
                            style={{color: "var(--text-tertiary)"}}
                        >
                            Datos principales
                        </p>
                        <p className="mt-1 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                            La matrícula será generada automáticamente por el sistema.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Nombre(s)*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-user me-1"/>
                    <input maxLength={64} placeholder="Nombre del estudiante" {...register("firstname")}/>
                </label>
                {errors.firstname?.message && <p className="text-xs font-semibold text-red-500">{errors.firstname.message}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Apellido(s)*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-id-card me-1"/>
                    <input maxLength={64} placeholder="Apellido del estudiante" {...register("lastname")}/>
                </label>
                {errors.lastname?.message && <p className="text-xs font-semibold text-red-500">{errors.lastname.message}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Género*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-venus-mars me-1"/>
                    <select className="w-full bg-transparent outline-none" {...register("gender")}>
                        <option value="">Selecciona</option>
                        {Object.values(Gender).map((value) => (
                            <option key={value} value={value}>
                                {Genders[value as keyof typeof Gender]}
                            </option>
                        ))}
                    </select>
                </label>
                {errors.gender?.message && <p className="text-xs font-semibold text-red-500">{errors.gender.message}</p>}
            </div>

            <div className="space-y-1">
                <DatePicker
                    label="Fecha de nacimiento*"
                    value={birthDate ?? ""}
                    icon="fa-calendar-days"
                    required
                    onChange={(value) => setValue("birthDate", value, {shouldDirty: true, shouldValidate: true})}
                />
                {errors.birthDate?.message && <p className="text-xs font-semibold text-red-500">{errors.birthDate.message}</p>}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                <button type="button" className="btn btn-sm" onClick={onDone} disabled={submitting}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submitting || !isValid}>
                    {submitting ? "Guardando..." : "Guardar"}
                    <i className="fa fa-save ms-2"/>
                </button>
            </div>
        </form>
    );
};
