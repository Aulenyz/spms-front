import {yupResolver} from "@hookform/resolvers/yup";
import {useEffect, useState} from "react";
import {useForm} from "react-hook-form";
import {toast} from "react-toastify";
import {ProductCategory, ProductCategoryFormValues} from "../../../domain/model/product/ProductCategory.ts";
import {ProductCategorySchema} from "../../../schemas/ProductCategorySchema.ts";
import {ProductCategoryService} from "../../../services/product/ProductCategoryService.ts";
import {SimpleCheckbox} from "../../../components/io/Checkbox.tsx";

const productCategoryService = ProductCategoryService.instance;

export const ProductCategoryForm = ({
                                        initial,
                                        onDone,
                                        onSaved,
                                    }: {
    initial?: ProductCategory | null;
    onDone: () => void;
    onSaved?: () => void;
}) => {
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        watch,
        formState: {errors, isValid},
    } = useForm<ProductCategoryFormValues>({
        resolver: yupResolver(ProductCategorySchema),
        defaultValues: {
            code: "",
            name: "",
            description: "",
            active: true,
        },
        mode: "onChange",
    });

    const isEdit = Boolean(initial?.id);
    const active = watch("active");

    useEffect(() => {
        reset({
            code: initial?.code ?? "",
            name: initial?.name ?? "",
            description: initial?.description ?? "",
            active: initial?.active ?? true,
        });
    }, [initial, reset]);

    const submit = async (values: ProductCategoryFormValues) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const payload: ProductCategoryFormValues = {
                code: values.code.trim(),
                name: values.name.trim(),
                description: values.description.trim(),
                active: values.active,
            };

            const [codeExists, nameExists] = await Promise.all([
                productCategoryService.existsByCode(payload.code, initial?.id),
                productCategoryService.existsByName(payload.name, initial?.id),
            ]);

            if (codeExists) {
                setError("code", {message: "Ya existe una categoría con este código."});
            }
            if (nameExists) {
                setError("name", {message: "Ya existe una categoría con este nombre."});
            }
            if (codeExists || nameExists) return;

            if (isEdit && initial?.id) {
                await productCategoryService.updateCategory(initial.id, payload);
                toast.success("Categoría actualizada correctamente.");
            } else {
                const {active: _active, ...createPayload} = payload;
                await productCategoryService.createCategory(createPayload);
                toast.success("Categoría creada correctamente.");
            }

            onSaved?.();
            onDone();
        } catch (error) {
            const message = (error as { message?: string })?.message;
            toast.error(message?.trim() || `No se pudo ${isEdit ? "actualizar" : "crear"} la categoría.`);
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
                        <i className={`fa ${isEdit ? "fa-pen-to-square" : "fa-folder-plus"}`}/>
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]"
                           style={{color: "var(--text-tertiary)"}}>
                            Datos principales
                        </p>
                        <p className="mt-1 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                            El código será completado con ceros a la izquierda por el sistema.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Código*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-hashtag me-1"/>
                    <input
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Ej: 25"
                        {...register("code", {
                            onChange: (event) => {
                                event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);
                            },
                        })}
                    />
                </label>
                {errors.code?.message && <p className="text-xs font-semibold text-red-500">{errors.code.message}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Nombre*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-folder-open me-1"/>
                    <input maxLength={64} placeholder="Nombre de la categoría" {...register("name")}/>
                </label>
                {errors.name?.message && <p className="text-xs font-semibold text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                        Descripción
                    </label>
                    <span className="text-[11px]" style={{color: "var(--text-tertiary)"}}>Máximo 255 caracteres</span>
                </div>
                <textarea
                    className="input min-h-[140px] w-full resize-none py-3"
                    maxLength={255}
                    placeholder="Describe el propósito de esta categoría"
                    {...register("description")}
                />
                {errors.description?.message &&
                    <p className="text-xs font-semibold text-red-500">{errors.description.message}</p>}
            </div>

            {isEdit && (
                <div
                    className="flex items-center justify-between gap-4 rounded-[18px] border px-4 py-3"
                    style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                >
                    <div>
                        <p className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>Categoría activa</p>
                        <p className="mt-1 text-xs" style={{color: "var(--text-secondary)"}}>
                            Define si estará disponible para organizar recursos.
                        </p>
                    </div>
                    <SimpleCheckbox
                        label=""
                        checked={active}
                        onChange={(checked) => setValue("active", checked, {shouldValidate: true, shouldDirty: true})}
                    />
                </div>
            )}

            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                <button type="button" className="btn btn-sm" onClick={onDone} disabled={submitting}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submitting || !isValid}>
                    {submitting ? "Guardando..." : isEdit ? "Actualizar" : "Guardar"}
                    <i className="fa fa-save ms-2"/>
                </button>
            </div>
        </form>
    );
};
