import {BaseModel} from "../model/BaseModel.ts";

export interface Guardian extends BaseModel {
    document: string;
    firstname: string;
    lastname: string;
    email?: string;
    phone?: string;
    address?: string;
    name?: string;
}

export enum Relationship {
    MOTHER = "MOTHER",
    FATHER = "FATHER",
    TUTOR = "TUTOR",
}

export const RelationshipLabel: Record<Relationship, string> = {
    [Relationship.MOTHER]: "Madre",
    [Relationship.FATHER]: "Padre",
    [Relationship.TUTOR]: "Tutor",
};

/** Representante de un estudiante con su parentesco. */
export interface StudentGuardian {
    guardian: Guardian;
    relationship: Relationship;
}

export interface GuardianFormValues {
    document: string;
    firstname: string;
    lastname: string;
    phone: string;
    email?: string;
    address?: string;
}
