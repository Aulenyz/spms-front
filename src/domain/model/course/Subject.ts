import {BaseModel} from "../BaseModel.ts";

export interface Subject extends BaseModel {
    name: string;
    code: string;
    active: boolean;
    description?: string;
}

export interface SubjectFormValues {
    name: string;
    code: string;
    description: string;
}
