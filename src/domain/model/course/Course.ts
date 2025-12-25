import {BaseModel} from "../BaseModel.ts";

export interface Course extends BaseModel {
    division: string;
    specialization: Specialization | null;
}

export interface CourseTemplate extends BaseModel {
    count: number;
    specialization: Specialization;
}

export interface Specialization extends BaseModel {
    name: string;
    description?: string;
    type: GradeType;
    active: boolean;
}

export interface SpecializationFormValues {
    name: string;
    description?: string;
    type: GradeType;
}

export enum GradeType {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
    TECHNICAL = "TECHNICAL",
}

export const GradeTypeLabel: Record<GradeType, string> = {
    PRIMARY: "Primaria",
    SECONDARY: "Secundaria",
    TECHNICAL: "Técnico",
};

