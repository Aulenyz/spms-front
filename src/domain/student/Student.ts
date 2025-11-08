import {Gender} from "../model/user/user";
import {BaseModel} from "../model/BaseModel.ts";

export interface Student extends BaseModel {
    document: String
    firstname: String
    lastname: String
    gender: Gender
    status: StudentStatus
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


