

import {BaseService} from "../BaseService.ts";
import {Student, StudentStatus} from "../../domain/student/Student.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {BulkValidationResponse} from "../../domain/student/BulkValidation.ts";

export class StudentService extends BaseService<Student> {

    private static factory: StudentService = new StudentService();

    static get instance(): StudentService {
        return StudentService.factory;
    }

    constructor() {
        super('/students');
    }

    search(term: string, pagination: Pagination = Pagination.first): Promise<Page<Student>> {
        return this.get<Page<Student>>('/search', {...pagination, term});
    }

    async getTotalByStatus(): Promise<Record<StudentStatus, number>> {
        return super.get<Record<StudentStatus, number>>('/grouped');
    }

    async downloadTemplate(): Promise<void> {
        const blob = await this.get<Blob>('/template/download');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_estudiantes.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    }

    validateBulk(file: File): Promise<BulkValidationResponse> {
        return this.form<BulkValidationResponse>('/bulk/validate', { file });
    }
}
