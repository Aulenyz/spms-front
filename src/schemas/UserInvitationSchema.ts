import {number, object, ObjectSchema, string} from "yup";
import {UserInvitationFormValues} from "../domain/model/user/user.ts";
import {Messages} from "../domain/types/Messages.ts";

export const UserInvitationSchema: ObjectSchema<UserInvitationFormValues> = object({
    email: string().email(Messages.InvalidEmail).required(Messages.RequiredField),
    roleId: number().required(Messages.RequiredField).typeError(Messages.RequiredField),
});
