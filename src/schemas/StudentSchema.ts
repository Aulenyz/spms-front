import { object, ObjectSchema, string, mixed } from "yup";
import { Messages } from "../domain/types/Messages.ts";
import {StudentFormValues} from "../domain/student/Student.ts";
import {Gender} from "../domain/model/user/user.ts";

export const StudentSchema: ObjectSchema<StudentFormValues> = object({
    firstname: string().required(Messages.RequiredField),
    lastname: string().required(Messages.RequiredField),
    gender: mixed<Gender>().oneOf(Object.values(Gender))
        .required(Messages.RequiredField),
    birthDate: string().required(Messages.RequiredField),
});
