import {object, ObjectSchema, string} from "yup";
import {AuthorityFormValues} from "../domain/model/user/user.ts";
import {Messages} from "../domain/types/Messages.ts";

export const AuthoritySchema: ObjectSchema<AuthorityFormValues> = object({
    key: string().matches(/^[A-Z_]+$/, Messages.InvalidKey).required(Messages.RequiredField),
    name: string().required(Messages.RequiredField),
    description: string().required(Messages.RequiredField),
});
