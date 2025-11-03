import {ChangePassword} from "../../domain/model/account/ChangePassword.ts";
import {object, ObjectSchema, string, TestContext} from "yup";
import {Messages} from "../../domain/types/Messages.ts";
import {Optional} from "../../domain/types/steoreotype.ts";

export const changePasswordSchema: ObjectSchema<ChangePassword> = object().shape({
    currentPassword: string().required(Messages.RequiredField),
    newPassword: string()
        .min(8, Messages.MinLengthOf8)
        .max(64, Messages.LengthOfN(64))
        .matches(/[A-Z]/, Messages.oneMayus)
        .matches(/[a-z]/, Messages.oneMin)
        .test('NotSamePassword', Messages.matchesPassword, (value: Optional<string>, context: TestContext) => {
            return value !== context.parent.currentPassword;
        }).required(Messages.RequiredField),
    confirmPassword: string().test('Validate Password', Messages.PasswordNotMatches, (value: Optional<string>, context: TestContext) => {
        return context.parent.newPassword === value;
    }).required(Messages.RequiredField),
})