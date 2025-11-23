import {BaseModel} from "../BaseModel.ts";

export interface Course extends BaseModel {
    division: string;
    specialization: Specialization | null;
}

export interface Specialization extends BaseModel {
    name: string;
    description?: string;
    type: GradeType;
}

export enum GradeType {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
    TECHNICAL = "TECHNICAL",
}
