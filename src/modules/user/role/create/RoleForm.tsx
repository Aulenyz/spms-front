import {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {toast} from "react-toastify";

import {RoleFormValues} from "../../../../domain/model/user/user.ts";
import {AssistantService} from "../../../../services/assistant/AssistantService.ts";
import {RoleService} from "../../../../services/user/RoleService.ts";

const roleService = RoleService.instance;

export const RoleForm = ({onSubmit}: { onSubmit?: () => void }) => {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});
    const [values, setValues] = useState<RoleFormValues>({
        name: "",
        description: "",
    });

    // La IA escribe la descripción a partir del nombre solo cuando se pulsa el botón.
    const {data: assistant} = useQuery({
        queryKey: ["assistant", "status"],
        queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(),
        staleTime: Infinity,
        meta: {silent: true},
    });
    const trimmedName = values.name.trim();
    const [suggesting, setSuggesting] = useState(false);
    const [suggested, setSuggested] = useState(false);
    const [manual, setManual] = useState(false);
    const canSuggest = Boolean(assistant?.enabled) && trimmedName.length >= 3;

    const suggest = async () => {
        if (!canSuggest) return;
        setSuggesting(true);
        try {
            const {description} = await AssistantService.instance.describe("role", trimmedName);
            setField("description", description);
            setManual(false);
            setSuggested(true);
        } catch {
            // Si la IA no responde, la descripción se escribe a mano.
        } finally {
            setSuggesting(false);
        }
    };

    const canSubmit = useMemo(() => {
        return Boolean(values.name.trim()) && Boolean(values.description.trim());
    }, [values]);

    const setField = (key: keyof RoleFormValues, value: string) => {
        setValues((prev) => ({...prev, [key]: value}));
        setErrors((prev) => ({...prev, [key]: undefined}));
    };

    const validateLocal = () => {
        const nextErrors: Partial<Record<keyof RoleFormValues, string>> = {};
        if (!values.name.trim()) nextErrors.name = "El nombre es obligatorio.";
        if (!values.description.trim()) nextErrors.description = "La descripción es obligatoria.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const submit = async () => {
        if (submitting) return;
        if (!validateLocal()) return;

        setSubmitting(true);
        try {
            const payload: RoleFormValues = {
                name: values.name.trim(),
                description: values.description.trim(),
            };

            if (await roleService.existsByName(payload.name)) {
                setErrors((prev) => ({...prev, name: "El nombre del rol ya existe."}));
                return;
            }

            await roleService.create("", payload);
            toast.success("Rol creado con éxito.");
            onSubmit?.();
        } catch {
            toast.error("Error creando el rol.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <div className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>
                    Datos principales
                </div>
                <div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Define el nombre y la descripción del rol que se asignara a los usuarios.
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Nombre*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-user-shield me-1"/>
                    <input
                        placeholder="Nombre del rol"
                        value={values.name}
                        onChange={(event) => setField("name", event.target.value)}
                    />
                </label>
                {errors.name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Descripcion*
                </label>
                <div className="flex items-start gap-2">
                    <textarea
                        className="input min-h-[120px] w-full min-w-0 flex-1 resize-none py-3"
                        placeholder={assistant?.enabled ? "Escríbela o pulsa el botón para que la IA la sugiera" : "Describe el objetivo de este rol"}
                        value={values.description}
                        onChange={(event) => { setField("description", event.target.value); setManual(true); }}
                    />
                    {assistant?.enabled && (
                    <button type="button" className="btn btn-sm btn-square mt-1 shrink-0" disabled={!canSuggest || suggesting}
                            title={suggested ? "Otra sugerencia con IA" : "Sugerir con IA"} aria-label="Sugerir descripción con IA"
                            onClick={() => void suggest()}>
                        <i className={`fa ${suggesting ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} style={{color: "var(--accent)"}}/>
                    </button>
                )}
                </div>
                <p className="min-h-[1.25rem] text-xs" style={{color: "var(--text-tertiary)"}}>
                    {suggesting ? "La IA está escribiendo la descripción…" : suggested && !manual ? "Sugerida por IA; puedes editarla." : ""}
                </p>
                {errors.description && <p className="mt-1 text-xs font-semibold text-red-500">{errors.description}</p>}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="btn btn-sm"
                    onClick={onSubmit}
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
