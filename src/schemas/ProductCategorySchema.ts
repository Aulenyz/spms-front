import {boolean, object, ObjectSchema, string} from "yup";
import {ProductCategoryFormValues} from "../domain/model/product/ProductCategory.ts";

export const ProductCategorySchema: ObjectSchema<ProductCategoryFormValues> = object({
    code: string()
        .required("El código es requerido.")
        .min(1, "El código debe tener entre 1 y 6 caracteres.")
        .max(6, "El código debe tener entre 1 y 6 caracteres.")
        .matches(/^\d+$/, "El código debe contener solamente números."),
    name: string()
        .trim()
        .required("El nombre es requerido.")
        .max(64, "El nombre no puede exceder 64 caracteres."),
    description: string()
        .trim()
        .max(255, "La descripción no puede exceder 255 caracteres.")
        .defined(),
    active: boolean()
        .required("El estado es requerido."),
});
