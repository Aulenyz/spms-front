import {BaseModel} from "../model/BaseModel.ts";

export interface Guardian extends BaseModel {
    document: string;
    firstname: string;
    lastname: string;
    email?: string;
    phone?: string;
    address?: string;
    name?: string;
}
