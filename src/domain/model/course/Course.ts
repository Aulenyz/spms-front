import {BaseModel} from "../BaseModel.ts";
import {Subject} from "./Subject.ts";
import {TemplateSlot} from "../../../modules/course/template/schedule.ts";

export interface Course extends BaseModel {
    name: string;
    active: boolean;
    type: GradeType;
    division: string;
    specialization: Specialization | null;
    /** Curso base del que se generó; vacío en los cursos rápidos. */
    templateId?: number | null;
    academicAssignments?: CourseAcademicAssignment[];
}

export interface CourseAcademicAssignment extends BaseModel {
    subject: Subject;
    teacher?: CourseTeacher | null;
    /** Clases de la semana según el curso base (sección del curso). */
    slots?: TemplateSlot[];
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
    /** Un curso base inactivo ya no genera cursos. */
    active?: boolean;
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
