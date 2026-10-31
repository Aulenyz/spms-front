import {BaseService} from "../../BaseService.ts";
import {Enrollment, EnrollmentStatus} from "../../../domain/student/Enrollment.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {EnrollmentPreview, EnrollmentResult} from "../../../domain/billing/Invoice.ts";

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

    preview(studentId: number, courseId: number): Promise<EnrollmentPreview> {
        return this.get<EnrollmentPreview>("/preview", {studentId, courseId});
    }

    /** Inscribe al estudiante y genera la factura de inscripción o reinscripción. */
    enroll(studentId: number, courseId: number): Promise<EnrollmentResult> {
        return this.post<EnrollmentResult>("", {studentId, courseId});
    }

    byCourse(courseId: number | string, term: string = "", pagination: Pagination = Pagination.default): Promise<Page<Enrollment>> {
        return this.getAll({courseId, term}, pagination);
    }
}
