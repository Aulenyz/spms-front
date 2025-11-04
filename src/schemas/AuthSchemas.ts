import {object, ObjectSchema, string} from "yup";
import {UserPasswordLogin} from "../domain/model/auth/Login.ts";
import {Messages} from "../domain/types/Messages.ts";
import {RecoverPassword, SendRecoverRequest} from "../domain/model/account/RecoverPassword.ts";

export const LoginSchema: ObjectSchema<UserPasswordLogin> = object().shape({
        username: string().required(Messages.RequiredField),
        password: string().required(Messages.RequiredField)
    }
)

export const RecoverSchema: ObjectSchema<RecoverPassword> = object().shape({
    token: string().required(Messages.RequiredField),
    password: string().required(Messages.RequiredField),
    repeated: string().required(Messages.RequiredField),
    }
)

export const SendRecoverPasswordSchema: ObjectSchema<SendRecoverRequest> = object().shape({
        username: string().required(Messages.RequiredField),
    }
)