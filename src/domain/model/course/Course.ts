import {BaseModel} from "../BaseModel.ts";
import {Subject} from "./Subject.ts";

export interface Course extends BaseModel {
    name: string;
    active: boolean;
    type: GradeType;
    division: string;
    specialization: Specialization | null;
    academicAssignments?: CourseAcademicAssignment[];
}

export interface ScheduleSlot {
    id?: number;
    dayOfWeek: WeekDay;
    startsAt: string;
    endsAt: string;
}

export interface CourseAcademicAssignment extends BaseModel {
    subject: Subject;
    teacher?: CourseTeacher | null;
    schedule?: ScheduleSlot[];
}

export interface CourseTeacher {
    id: number;
    name: string;
    email: string;
    image?: string;
}

export interface CourseTemplate extends BaseModel {
    name?: string;
    count: number;
    type?: GradeType;
    specialization: Specialization | null;
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

export type WeekDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";

export const WeekDayLabel: Record<WeekDay, string> = {
    MONDAY: "Lunes",
    TUESDAY: "Martes",
    WEDNESDAY: "Miércoles",
    THURSDAY: "Jueves",
    FRIDAY: "Viernes",
};

export const GradeTypeLabel: Record<GradeType, string> = {
    PRIMARY: "Primaria",
    SECONDARY: "Secundaria",
    TECHNICAL: "Técnico",
};
