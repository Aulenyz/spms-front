import {object, ObjectSchema, string, TestContext} from "yup";
import {UserPasswordLogin} from "../domain/model/auth/Login.ts";
import {Messages} from "../domain/types/Messages.ts";
import {Optional} from "../domain/types/steoreotype.ts";
import {RecoverPassword, SendRecoverRequest} from "../domain/model/account/RecoverPassword.ts";

export const LoginSchema: ObjectSchema<UserPasswordLogin> = object().shape({
        username: string().required(Messages.RequiredField),
        password: string().required(Messages.RequiredField)
    }
)

export const RecoverSchema: ObjectSchema<RecoverPassword> = object().shape({
        token: string().required(Messages.RequiredField),
        password: string().required(Messages.RequiredField),
        repeated: string()
            .test('Validate RNC', Messages.PasswordNotMatches, (value: Optional<string>, context: TestContext) => {
                return context.parent.password === value;
            }).required(Messages.RequiredField),
    }
)

export const SendRecoverPasswordSchema: ObjectSchema<SendRecoverRequest> = object().shape({
        username: string().required(Messages.RequiredField),
        company: string().required(Messages.RequiredField)
    }
)