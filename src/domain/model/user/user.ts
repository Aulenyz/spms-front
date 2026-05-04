import {SelectOption} from "../../types/steoreotype.ts";
import {BaseModel} from "../BaseModel.ts";

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER'
}

export enum DocumentType {
    ID_CARD = 'ID_CARD',
    PASSPORT = 'PASSPORT'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CANCELLED = 'CANCELLED',
}

export const colorMap: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: "bg-green-500",
    [UserStatus.INACTIVE]: "bg-gray-400",
    [UserStatus.CANCELLED]: "bg-red-500",
};

export const mapColor: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: "bg-green-100 text-green-800 border-green-300",
    [UserStatus.INACTIVE]: "bg-gray-100 text-gray-700 border-gray-300",
    [UserStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-300",
};

export const statusOrder: UserStatus[] = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.CANCELLED
];

export const UserStatusLabel: Record<keyof typeof UserStatus, string> = {
    INACTIVE: 'Inactivo',
    CANCELLED: 'Cancelado',
    ACTIVE: 'Activo'
}

export const Genders: Record<keyof typeof Gender, string> = {
    MALE: 'Masculino',
    FEMALE: 'Femenino',
    OTHER: 'Otro',
}

export const DocumentTypeLabel: Record<keyof typeof DocumentType, string> = {
    ID_CARD: 'Cedula',
    PASSPORT: 'Pasaporte',
}

export const GenderOptions: Array<SelectOption> = Object.keys(Gender).map(key => {
    return {
        value: key,
        description: Genders[key as keyof typeof Gender]
    }
});

export const DocumentTypeOptions: Array<SelectOption> = Object.keys(DocumentType).map(key => ({
    value: key,
    description: DocumentTypeLabel[key as keyof typeof DocumentType],
}));

export interface User extends BaseModel {
    username: string;
    email: string;
    document: string;
    role: UserRole;
    status: UserStatus;
    info: UserInfo;
    organization: Organization;
}


export interface MiniUser extends BaseModel {
    name: string;
    email: string;
    image: string;
    username: string;
    status: UserStatus;
}

export interface UserInvitation extends BaseModel {
    email: string;
    role: UserRole;
    createdBy: MiniUser;
    status: InvitationStatus;
}

export interface UserInvitationFormValues {
    email: string;
    roleId: number;
}

export enum InvitationStatus {
    ACCEPTED = 'ACCEPTED',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED',
}

export const invitationColorMap: Record<InvitationStatus, string> = {
    [InvitationStatus.ACCEPTED]: "bg-green-500",
    [InvitationStatus.PENDING]: "bg-gray-400",
    [InvitationStatus.CANCELLED]: "bg-red-500",
};

export const InvitationStatusLabel: Record<keyof typeof InvitationStatus, string> = {
    ACCEPTED: 'Aceptada',
    PENDING: 'Pendiente',
    CANCELLED: 'Cancelada'
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
    countAuthorities: number;
    authorities: RoleAuthority[];
}

export interface RoleAuthority extends BaseModel {
    authority: UserAuthority;
}

export interface RoleFormValues {
    name: string;
    description: string;
}

export interface UserAuthority extends BaseModel {
    key: string;
    name: string;
    description: string;
}

export interface AuthorityFormValues {
    key: string;
    name: string;
    description: string;
}

export interface PublicRegisterUserFormValues {
    image: string;
    gender: Gender;
    token: string;
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    type: DocumentType;
    document: string;
}

export const UserOptionMapper = ({id, info}: User): SelectOption => ({value: id, description: info.name});
export const RoleOptionMapper = ({id: value, description}: UserRole) => ({value, description});
