import {Guardian} from "../../../domain/student/Guardian.ts";
import {BaseService} from "../../BaseService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";

export class GuardianService extends BaseService<Guardian> {

    private static factory: GuardianService = new GuardianService();

    static get instance(): GuardianService {
        return GuardianService.factory;
    }

    constructor() {
        super('/students/guardians');
    }

    findByDocument(document: string): Promise<Guardian> {
        const normalized = encodeURIComponent(document?.trim() ?? '');
        return this.get<Guardian>(`/document/${normalized}`);
    }

    listByStudentId(studentId: number, pagination: Pagination = Pagination.first): Promise<Page<Guardian>> {
        return this.getAll({studentId}, pagination);
    }
}
