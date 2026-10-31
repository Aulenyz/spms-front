import {useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";
import {useQuery} from "@tanstack/react-query";

import {Subject, SubjectFormValues} from "../../domain/model/course/Subject.ts";
import {SubjectService} from "../../services/course/SubjectService.ts";
import {AssistantService} from "../../services/assistant/AssistantService.ts";

const subjectService = SubjectService.instance;

export const SubjectForm = ({
                                initial,
                                onDone,
                                onSaved,
                            }: {
    initial?: Subject | null;
    onDone: () => void;
    onSaved?: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof SubjectFormValues, string>>>({});
    const [values, setValues] = useState<SubjectFormValues>({
        name: "",
        code: "",
        description: "",
    });

    const isEdit = Boolean(initial?.id);

    // La IA escribe el código y la descripción a partir del nombre solo cuando se pulsa el botón.
    const {data: assistant} = useQuery({
        queryKey: ["assistant", "status"],
        queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(),
        staleTime: Infinity,
        meta: {silent: true},
    });
    const [suggesting, setSuggesting] = useState(false);
    const [suggested, setSuggested] = useState(false);
    const canSuggest = Boolean(assistant?.enabled) && values.name.trim().length >= 3;

    const suggest = async () => {
        if (!canSuggest) return;
        setSuggesting(true);
        try {
            const {description, code} = await AssistantService.instance.describe("subject", values.name.trim());
            setValues((prev) => ({...prev, description, code: code || prev.code}));
            setErrors((prev) => ({...prev, description: undefined, code: code ? undefined : prev.code}));
            setSuggested(true);
        } catch {
            // Si la IA no responde, la descripción se escribe a mano.
        } finally {
            setSuggesting(false);
        }
    };

    useEffect(() => {
        if (!initial) return;
        setValues({
            name: (initial.name ?? "").toString(),
            code: (initial.code ?? "").toString(),
            description: (initial.description ?? "").toString(),
        });
    }, [initial]);

    const canSubmit = useMemo(() => {
        return Boolean(values.name.trim())
            && Boolean(values.code.trim())
            && Boolean(values.description.trim())
            && values.name.trim().length <= 96
            && values.code.trim().length <= 24
            && values.description.trim().length <= 255;
    }, [values]);

    const validateLocal = () => {
        const nextErrors: Partial<Record<keyof SubjectFormValues, string>> = {};
        if (!values.name.trim()) nextErrors.name = "El nombre es obligatorio.";
        else if (values.name.trim().length > 96) nextErrors.name = "El nombre no puede exceder 96 caracteres.";
        if (!values.code.trim()) nextErrors.code = "El código es obligatorio.";
        else if (values.code.trim().length > 24) nextErrors.code = "El código no puede exceder 24 caracteres.";
        if (!values.description.trim()) nextErrors.description = "La descripción es obligatoria.";
        else if (values.description.trim().length > 255) nextErrors.description = "La descripción no puede exceder 255 caracteres.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const submit = async () => {
        if (submitting) return;
        if (!validateLocal()) return;

        setSubmitting(true);
        try {
            const payload: SubjectFormValues = {
                name: values.name.trim(),
                code: values.code.trim(),
                description: values.description.trim(),
            };

            if (await subjectService.existsByName(payload.name, initial?.id)) {
                setErrors((prev) => ({...prev, name: "Ya existe una materia con ese nombre."}));
                return;
            }

            if (await subjectService.existsByCode(payload.code, initial?.id)) {
                setErrors((prev) => ({...prev, code: "Ya existe una materia con ese código."}));
                return;
            }

            if (isEdit && initial?.id) {
                await subjectService.updateSubject(initial.id, payload);
                toast.success("Materia actualizada.");
            } else {
                await subjectService.createSubject(payload);
                toast.success("Materia agregada satisfactoriamente.");
            }

            onSaved?.();
            onDone();
        } catch (error) {
            const message = (error as { message?: string })?.message;
            toast.error(message?.trim() || "No se pudo guardar la materia.");
        } finally {
            setSubmitting(false);
        }
    };

    const setField = (key: keyof SubjectFormValues, value: string) => {
        setValues((prev) => ({...prev, [key]: value}));
        setErrors((prev) => ({...prev, [key]: undefined}));
    };

    return (
        <form
            className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <div className="rounded-[22px] border p-4" style={{
                borderColor: "var(--border-soft)",
                background: "var(--surface)",
                boxShadow: "var(--shadow-soft)"
            }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]"
                     style={{color: "var(--text-tertiary)"}}>
                    Datos principales
                </div>
                <div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Registra el nombre, código y descripción base de la materia.
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Nombre*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-book-open me-1"/>
                    <input
                        placeholder="Nombre de la materia"
                        value={values.name}
                        maxLength={96}
                        onChange={(event) => setField("name", event.target.value)}
                    />
                </label>
                {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Codigo*
                </label>
                <div className="flex items-center gap-2">
                    <label className="input input-sm min-w-0 flex-1">
                        <i className="fa fa-hashtag me-1"/>
                        <input
                            placeholder="Código corto"
                            value={values.code}
                            maxLength={24}
                            onChange={(event) => setField("code", event.target.value)}
                        />
                    </label>
                    {assistant?.enabled && (
                        <button type="button" className="btn btn-sm btn-square shrink-0" disabled={!canSuggest || suggesting}
                                title={suggested ? "Otra sugerencia con IA" : "Sugerir con IA"} aria-label="Sugerir código y descripción con IA"
                                onClick={() => void suggest()}>
                            <i className={`fa ${suggesting ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} style={{color: "var(--accent)"}}/>
                        </button>
                    )}
                </div>
                {(suggesting || suggested) && (
                    <p className="text-xs" style={{color: "var(--text-tertiary)"}}>
                        {suggesting ? "La IA está escribiendo el código y la descripción…" : "Código y descripción sugeridos por IA; puedes editarlos."}
                    </p>
                )}
                {errors.code && <p className="mt-1 text-xs font-semibold text-red-500">{errors.code}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Descripcion*
                </label>
                <textarea
                    className="input h-auto min-h-[120px] w-full resize-none py-3 leading-relaxed"
                    placeholder="Describe la materia"
                    value={values.description}
                    maxLength={255}
                    rows={4}
                    onChange={(event) => setField("description", event.target.value)}
                />
                {errors.description && <p className="mt-1 text-xs font-semibold text-red-500">{errors.description}</p>}
            </div>

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
