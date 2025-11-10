import {BaseModel} from "../model/BaseModel.ts";
import {Student} from "./Student.ts";
import {Course} from "../model/course/Course.ts";
import {Period} from "../model/organization/Organization.tsx";

export interface Enrollment extends BaseModel {
    student: Student;
    course: Course;
    period: Period;
    date: string;
    status: EnrollmentStatus;
}

export enum EnrollmentStatus {
    PENDING = "PENDING",
    ENROLLED = "ENROLLED",
    WITHDRAWN = "WITHDRAWN",
}

export const EnrollmentStatusLabel: Record<keyof typeof EnrollmentStatus, string> = {
    PENDING: 'Pendiente',
    ENROLLED: 'Inscrito',
    WITHDRAWN: 'Retirado'
}

export const EnrollmentStatusColor: Record<keyof typeof EnrollmentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    ENROLLED: 'bg-green-100 text-green-800 border-green-300',
    WITHDRAWN: 'bg-red-100 text-red-800 border-red-300'
}

export const EnrollmentStatusColorMap: Record<keyof typeof EnrollmentStatus, string> = {
    PENDING: "bg-yellow-500",
    ENROLLED: "bg-green-500",
    WITHDRAWN: "bg-red-500"
}



