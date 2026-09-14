import {BaseModel} from "../BaseModel";

export interface Organization extends BaseModel {
    name: string;
    document: string;
    logo?: string;
    active: boolean;
}

export interface OrganizationUser extends BaseModel {
    name: string;
    email: string;
    username: string;
    image?: string;
    status: "ACTIVE" | "INACTIVE" | "CANCELLED";
    role?: {id?: number; name?: string; description?: string};
}

export interface OrganizationInvitation extends BaseModel {
    email: string;
    role?: {name?: string};
    status: "PENDING" | "ACCEPTED" | "CANCELLED";
}
