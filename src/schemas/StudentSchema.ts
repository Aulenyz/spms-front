import { object, ObjectSchema, string, mixed } from "yup";
import { Messages } from "../domain/types/Messages.ts";
import { StudentFormValues } from "../domain/student/Student.ts";
import { Gender } from "../domain/model/user/user.ts";

export const StudentSchema: ObjectSchema<StudentFormValues> = object({
    firstname: string()
        .required(Messages.RequiredField)
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(50, "El nombre no puede superar los 50 caracteres"),

    lastname: string()
        .required(Messages.RequiredField)
        .min(3, "El apellido debe tener al menos 3 caracteres")
        .max(50, "El apellido no puede superar los 50 caracteres"),

    gender: mixed<Gender>()
        .oneOf(
            Object.values(Gender),
            "Debe seleccionar un género válido"
        )
        .required(Messages.RequiredField),

    birthDate: string()
        .nullable()

});