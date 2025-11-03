import {Gender} from "./user.ts";
import {Nullable} from "../../types/steoreotype.ts";

export interface PersonalInfoForm {
    id?: number;
    document: string;
    image: string;
    username: string;
    firstname: string;
    lastname: string;
    gender: Gender;
    birth: Date;
}

export interface ContactInfoForm {
    id?: number;
    email?: string;
    phone?: string;
    cellphone: string;
    addressOne: string;
    addressTwo?: string;
}


export interface LaboralInfoForm {
    roleId: number;
    hiredAt?: Date;
    salary?: number;
    calendar?: {
        startAt?: Nullable<Date>;
        freeTime?: string;
        workTime?: string;
    }
}
