import {BaseService} from "../BaseService.ts";
import {PaymentStatus} from "../../domain/model/payment/Payment.ts";

export class PaymentService extends BaseService {

    private static factory: PaymentService = new PaymentService();

    static get instance(): PaymentService {
        return PaymentService.factory;
    }

    constructor() {
        super('/payments');
    }

    async getTotalByStatus(periodId: number): Promise<Record<PaymentStatus, number>> {
        const url = `/grouped?periodId=${periodId}`;
        return super.get<Record<PaymentStatus, number>>(url);
    }
}