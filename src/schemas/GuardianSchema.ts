import {object, ObjectSchema, string} from "yup";
import {Messages} from "../domain/types/Messages.ts";
import {GuardianFormValues} from "../domain/student/Guardian.ts";

export const GuardianSchema: ObjectSchema<GuardianFormValues> = object({
    document: string().required(Messages.RequiredField),
    firstname: string().required(Messages.RequiredField),
    lastname: string().required(Messages.RequiredField),
    phone: string().required(Messages.RequiredField),
    email: string().email(Messages.InvalidEmail).optional(),
    address: string().optional(),
});
