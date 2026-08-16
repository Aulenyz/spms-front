import {useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";

import {CourseTemplate, GradeType, GradeTypeLabel, Specialization} from "../../../domain/model/course/Course.ts";
import {CourseTemplateService} from "../../../services/course/CourseTemplateService.ts";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {SpecializationSelect} from "./SpecializationSelect.tsx";

type FormValues = {
    name: string;
    count: string;
    type: GradeType | "";
    specialization: Specialization | null;
};

const courseTemplateService = CourseTemplateService.instance;

const typeOptions: SelectOption[] = Object.values(GradeType).map((type) => ({
    value: type,
    description: GradeTypeLabel[type],
}));

export const CourseTemplateForm = ({
    initial,
    onDone,
    onSaved,
}: {
    initial?: CourseTemplate | null;
    onDone: () => void;
    onSaved?: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [values, setValues] = useState<FormValues>({
        name: "",
        count: "1",
        type: "",
        specialization: null,
    });

    const isEdit = Boolean(initial?.id);

    useEffect(() => {
        if (!initial) return;
        setValues({
            name: (initial.name ?? "").toString(),
            count: Number.isFinite(initial.count) ? String(initial.count) : "1",
            type: (initial.type as GradeType) ?? "",
            specialization: initial.specialization ?? null,
        });
    }, [initial]);

    const canSubmit = useMemo(() => {
        const name = values.name.trim();
        const count = Number.parseInt(values.count, 10);
        return Boolean(name) && name.length <= 40 && Boolean(values.type) && Number.isFinite(count) && count >= 1;
    }, [values.name, values.type, values.count]);

    const submit = async () => {
        if (!canSubmit) {
            const name = values.name.trim();
            const count = Number.parseInt(values.count, 10);
            if (!name) {
                toast.error("El nombre es obligatorio.");
                return;
            }
            if (name.length > 40) {
                toast.error("El nombre no puede exceder 40 caracteres.");
                return;
            }
            if (!values.type) {
                toast.error("Selecciona un tipo.");
                return;
            }
            if (!Number.isFinite(count) || count < 1) {
                toast.error("La cantidad de secciones debe ser mayor a 0.");
                return;
            }
            toast.error("Completa los campos obligatorios.");
            return;
        }
        setSubmitting(true);
        try {
            const count = Number.parseInt(values.count, 10);
            const payload = {
                name: values.name.trim(),
                count,
                type: values.type,
                specializationId: values.specialization?.id ?? null,
            };

            if (isEdit) {
                await courseTemplateService.update(initial?.id, payload);
                toast.success("Plantilla actualizada.");
            } else {
                await courseTemplateService.create("", payload);
                toast.success("Plantilla creada.");
            }

            onSaved?.();
            onDone();
        } catch (error) {
            const message = (error as {message?: string})?.message;
            toast.error(message?.trim() || "No se pudo guardar la plantilla.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="relative flex h-full flex-col gap-2 px-5 pb-20 pt-4"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <div
                className="rounded-[20px] border px-4 py-3"
                style={{
                    borderColor: "var(--border-soft)",
                    background: "var(--surface-muted)",
                }}
            >
                <div className="flex items-start gap-3">
                    <span
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                        style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                    >
                        <i className="fa fa-calendar"/>
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{color: "var(--text-tertiary)"}}>
                            Nota
                        </p>
                        <p className="mt-1 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                            Estos cambios se reflejaran en el sistema para el proximo ano escolar.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Nombre*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-layer-group me-1"/>
                    <input
                        placeholder="Nombre de la Curso"
                        value={values.name}
                        maxLength={40}
                        onChange={(event) => setValues((prev) => ({...prev, name: event.target.value}))}
                    />
                </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Cantidad de secciones*
                    </label>
                    <label className="input input-sm w-full">
                        <i className="fa fa-hashtag me-1"/>
                        <input
                            type="number"
                            min={1}
                            placeholder="Ej: 3"
                            value={values.count}
                            onChange={(event) => {
                                // Allow clearing the field to type another number (e.g. delete "1" then type "2").
                                setValues((prev) => ({...prev, count: event.target.value}));
                            }}
                            onBlur={() => {
                                const raw = Number.parseInt(values.count, 10);
                                if (!Number.isFinite(raw) || raw < 1) {
                                    setValues((prev) => ({...prev, count: "1"}));
                                } else {
                                    setValues((prev) => ({...prev, count: String(raw)}));
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Tipo*
                    </label>
                    <DropdownSelect
                        text="Seleccionar tipo"
                        hasError={false}
                        options={typeOptions}
                        value={values.type}
                        onSelect={(value) => setValues((prev) => ({...prev, type: value as GradeType}))}
                        className="w-full"
                    />
                </div>
            </div>

            <SpecializationSelect
                value={values.specialization}
                onChange={(specialization) => setValues((prev) => ({...prev, specialization}))}
            />

            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="btn btn-sm"
                    onClick={onDone}
                    disabled={submitting}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={submitting || !canSubmit}
                >
                    {submitting ? "Guardando..." : "Guardar"}
                    <i className="fa fa-save ms-2"/>
                </button>
            </div>
        </form>
    );
};
