import {BaseService} from "../BaseService.ts";
import {Course} from "../../domain/model/course/Course.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";

export class CourseService extends BaseService<Course> {
    private static factory: CourseService = new CourseService();

    static get instance(): CourseService {
        return CourseService.factory;
    }

    constructor() {
        super("/courses");
    }

    search(term: string, pagination: Pagination = Pagination.first): Promise<Page<Course>> {
        // Backend expects `term` always present (even when empty).
        return this.get<Page<Course>>("/search", {...pagination, term: term ?? ""});
    }
}

