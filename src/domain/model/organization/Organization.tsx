import {BaseModel} from "../BaseModel";

export interface Organization extends BaseModel {
    name: string;
    logo: string;
    document: string;
}
