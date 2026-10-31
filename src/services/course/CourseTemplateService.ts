import {BaseService} from "../BaseService.ts";
import {CourseTemplate} from "../../domain/model/course/Course.ts";
import {Subject} from "../../domain/model/course/Subject.ts";

export type TeacherOption = {id: number; name: string; email: string; image?: string};
export type TemplateSubject = {id: number; name: string; description?: string};

export class CourseTemplateService extends BaseService<CourseTemplate> {

    private static factory: CourseTemplateService = new CourseTemplateService();

    static get instance(): CourseTemplateService {
        return CourseTemplateService.factory;
    }

    constructor() {
        super('/course/templates');
    }

    generateCourses(id: string | number): Promise<unknown[]> {
        return this.post<unknown[]>(`/${id}/courses`);
    }

    subjectOptions(id: string | number, term: string = ""): Promise<Subject[]> {
        return this.get<Subject[]>(`/${id}/subject-options`, {term});
    }

    templateSubjects(id: string | number): Promise<TemplateSubject[]> {
        return this.get<TemplateSubject[]>(`/${id}/template-subjects`);
    }

    addTemplateSubject(id: string | number, subjectId: number): Promise<TemplateSubject> {
        return this.put<TemplateSubject>(`/${id}/template-subjects`, {subjectId});
    }

    deleteTemplateSubject(templateSubjectId: number): Promise<unknown> {
        return this.delete<unknown>(`/template-subjects/${templateSubjectId}`);
    }
}
