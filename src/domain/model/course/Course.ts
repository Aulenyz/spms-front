import {BaseModel} from "../BaseModel.ts";

export interface Course extends BaseModel {
    grade: string;
    division: string;
    specialization: Specialization | null;
    type: GradeType;
}

export interface Specialization extends BaseModel {
    name: string;
    description?: string;
}

export enum GradeType {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
    TECHNICAL = "TECHNICAL",
}
