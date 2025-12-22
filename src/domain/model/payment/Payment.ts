import {BaseModel} from "../BaseModel.ts";
import {User} from "../user/user.ts";
import {Guardian} from "../../student/Guardian.ts";
import {Enrollment} from "../../student/Enrollment.ts";
import {Period} from "../organization/Organization.tsx";

export interface Payment extends BaseModel {
    identifier: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    user: User;
    guardian: Guardian;
    enrollment: Enrollment;
    period: Period;
}
export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CARD = 'CARD',
    OTHER = 'OTHER'
}

export enum PaymentStatus {
    PAID = 'PAID',
    CANCELLED = 'CANCELLED'
}

export const PaymentMethodLabel: Record<keyof typeof PaymentMethod, string> = {
    CASH: 'Efectivo',
    TRANSFER: 'Transferencia',
    CARD: 'Tarjeta',
    OTHER: 'Otro'
}

export const PaymentStatusLabel: Record<keyof typeof PaymentStatus, string> = {
    PAID: 'Pagado',
    CANCELLED: 'Cancelado'
}

export const statusColors: Record<keyof typeof PaymentStatus, string> = {
    PAID: "bg-green-500 text-white border-green-300",
    CANCELLED: "bg-red-500 text-white border-red-300",
};

