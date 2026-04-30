import {Gender} from "../model/user/user";
import {BaseModel} from "../model/BaseModel.ts";

export interface Student extends BaseModel {
    document: String
    firstname: String
    lastname: String
    gender: Gender
    status: StudentStatus
}

export interface StudentFormValues {
    firstname: string;
    lastname: string;
    gender: Gender;
    birthDate: string;
}

export enum StudentStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    GRADUATED = 'GRADUATED',
    WITHDRAWN = 'WITHDRAWN'
}

export const StudentStatusLabel: Record<keyof typeof StudentStatus, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    GRADUATED: 'Graduado',
    WITHDRAWN: 'Retirado'
}

export const statusColors: Record<StudentStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800 border-green-300",
    INACTIVE: "bg-gray-100 text-gray-700 border-gray-300",
    GRADUATED: "bg-blue-100 text-blue-800 border-blue-300",
    WITHDRAWN: "bg-red-100 text-red-800 border-red-300"
};

export const colorMap: Record<StudentStatus, string> = {
    [StudentStatus.ACTIVE]: "bg-green-500",
    [StudentStatus.INACTIVE]: "bg-gray-400",
    [StudentStatus.GRADUATED]: "bg-blue-500",
    [StudentStatus.WITHDRAWN]: "bg-red-500"
};
