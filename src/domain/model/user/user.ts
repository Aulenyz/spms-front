import {SelectOption} from "../../types/steoreotype.ts";
import {BaseModel} from "../BaseModel.ts";

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CANCELLED = 'CANCELLED',
}

export const UserStatusLabel: Record<keyof typeof UserStatus, string> = {
    INACTIVE: 'Inactivo',
    CANCELLED: 'Cancelado',
    ACTIVE: 'Activo'
}

export const Genders: Record<keyof typeof Gender, string> = {
    MALE: 'Masculino',
    FEMALE: 'Femenino',
}

export const GenderOptions: Array<SelectOption> = Object.keys(Gender).map(key => {
    return {
        value: key,
        description: Genders[key as keyof typeof Gender]
    }
});

export interface User extends BaseModel {
    username: string;
    email: string;
    document: string;
    role: UserRole;
    status: UserStatus;
    info: UserInfo;
    organization: Organization;
}

export interface Organization extends BaseModel {
    name: string;
    document: string;
    logo: string;
}

export interface UserInfo extends BaseModel {
    firstname: string;
    lastname: string;
    image: string;
    gender: Gender;
    birth: Date;
    name: string;
}

export interface UserRole extends BaseModel {
    name: string;
    description: string;
}

export const UserOptionMapper = ({id, info}: User): SelectOption => ({value: id, description: info.name});
export const RoleOptionMapper = ({id: value, description}: UserRole) => ({value, description});

