import {useMemo, useState} from "react";
import {toast} from "react-toastify";

import {RoleFormValues} from "../../../../domain/model/user/user.ts";
import {RoleService} from "../../../../services/user/RoleService.ts";

const roleService = RoleService.instance;

export const RoleForm = ({onSubmit}: { onSubmit?: () => void }) => {
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});
    const [values, setValues] = useState<RoleFormValues>({
        name: "",
        description: "",
    });

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
        if (!values.description.trim()) nextErrors.description = "La descripcion es obligatoria.";
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
            toast.success("Rol creado con exito.");
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
                    Define el nombre y la descripcion del rol que se asignara a los usuarios.
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
                <textarea
                    className="input min-h-[120px] w-full resize-none py-3"
                    placeholder="Describe el objetivo de este rol"
                    value={values.description}
                    onChange={(event) => setField("description", event.target.value)}
                />
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
