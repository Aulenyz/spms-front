import {BaseService} from "../../BaseService.ts";
import {Enrollment, EnrollmentStatus} from "../../../domain/student/Enrollment.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {EnrollmentStanding} from "../../../domain/billing/Invoice.ts";

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

    /** Si el estudiante está inscrito en el periodo actual (la caja lo exige antes de otros conceptos). */
    standing(studentId: number): Promise<EnrollmentStanding> {
        return this.get<EnrollmentStanding>("/standing", {studentId});
    }



    byCourse(courseId: number | string, term: string = "", pagination: Pagination = Pagination.default): Promise<Page<Enrollment>> {
        return this.getAll({courseId, term}, pagination);
    }
}
