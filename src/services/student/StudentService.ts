

import {BaseService} from "../BaseService.ts";
import {Student, StudentFormValues, StudentStatus} from "../../domain/student/Student.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {BulkValidationResponse} from "../../domain/student/BulkValidation.ts";
import {GuardianFormValues, Relationship, StudentGuardian} from "../../domain/student/Guardian.ts";

export type LinkGuardianValues = {guardianId?: number; guardian?: GuardianFormValues; relationship: Relationship};

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

    /** Representantes del estudiante con su parentesco. */
    guardians(studentId: number): Promise<StudentGuardian[]> {
        return this.get<StudentGuardian[]>(`/${studentId}/guardians`);
    }

    /** Vincula un representante (existente o nuevo); devuelve la lista actualizada. */
    linkGuardian(studentId: number, payload: LinkGuardianValues): Promise<StudentGuardian[]> {
        return this.post<StudentGuardian[]>(`/${studentId}/guardians`, payload);
    }

    createStudent(payload: StudentFormValues): Promise<Student> {
        return this.create("", payload) as Promise<Student>;
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
