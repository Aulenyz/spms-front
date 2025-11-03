import {BaseModel} from "../BaseModel.ts";

export interface UserPasswordLogin extends BaseModel {
    username: string;
    password: string;
}