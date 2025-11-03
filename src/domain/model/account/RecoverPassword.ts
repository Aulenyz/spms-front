import {CompanyModel} from "../CompanyModel.ts";

export interface RecoverPassword {
    token: string;
    password: string;
    repeated: string;
}

export interface SendRecoverRequest extends CompanyModel {
    username: string;
}