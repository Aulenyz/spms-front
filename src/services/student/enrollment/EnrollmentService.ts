import {BaseService} from "../../BaseService.ts";
import {Enrollment, EnrollmentStatus} from "../../../domain/student/Enrollment.ts";

export class EnrollmentService extends BaseService<Enrollment> {

    private static factory: EnrollmentService = new EnrollmentService();

    static get instance(): EnrollmentService {
        return EnrollmentService.factory;
    }

    constructor() {
        super('/enrollments');
    }

    async getTotalByStatus(periodId: number): Promise<Record<EnrollmentStatus, number>> {
        const url = `/grouped?periodId=${periodId}`;
        return super.get<Record<EnrollmentStatus, number>>(url);
    }
}