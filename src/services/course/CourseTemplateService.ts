import {BaseService} from "../BaseService.ts";
import {CourseTemplate} from "../../domain/model/course/Course.ts";

export class CourseTemplateService extends BaseService<CourseTemplate> {

    private static factory: CourseTemplateService = new CourseTemplateService();

    static get instance(): CourseTemplateService {
        return CourseTemplateService.factory;
    }

    constructor() {
        super('/course/templates');
    }
}