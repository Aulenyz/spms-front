import {BaseModel} from "../BaseModel";

export interface Organization extends BaseModel {
    name: string;
    document: string;
    logo?: string;
    active: boolean;
}
