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

export interface GuardianFormValues {
    document: string;
    firstname: string;
    lastname: string;
    phone: string;
    email?: string;
    address?: string;
}
