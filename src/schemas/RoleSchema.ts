import {object, ObjectSchema, string} from "yup";
import {RoleFormValues} from "../domain/model/user/user.ts";
import {Messages} from "../domain/types/Messages.ts";

export const RoleSchema: ObjectSchema<RoleFormValues> = object({
    name: string().required(Messages.RequiredField),
    description: string().required(Messages.RequiredField),
});
