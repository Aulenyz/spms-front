import {BaseService} from "../BaseService.ts";
import {Student, StudentStatus} from "../../domain/student/Student.ts";

export class StudentService extends BaseService<Student> {

    private static factory: StudentService = new StudentService();

    static get instance(): StudentService {
        return StudentService.factory;
    }

    constructor() {
        super('/students');
    }

    async getTotalByStatus(): Promise<Record<StudentStatus, number>> {
        return super.get<Record<StudentStatus, number>>('/grouped');
    }
}