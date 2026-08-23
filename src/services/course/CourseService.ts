import {BaseService} from "../BaseService.ts";
import {Course, CourseAcademicAssignment, GradeType, ScheduleSlot} from "../../domain/model/course/Course.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Subject} from "../../domain/model/course/Subject.ts";
import {TeacherOption} from "./CourseTemplateService.ts";

export type CourseAcademicAssignmentRequest = {
    subjectId: number;
    teacherId: number;
    schedule: ScheduleSlot[];
};

export type QuickCourseRequest = {
    name: string;
    division: string;
    type: GradeType;
    specializationId?: number | null;
    assignments: CourseAcademicAssignmentRequest[];
};

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

    createQuick(request: QuickCourseRequest): Promise<Course> {
        return this.post<Course>("/quick", request);
    }

    subjectOptions(term: string = ""): Promise<Subject[]> {
        return this.get<Subject[]>("/subject-options", {term});
    }

    teacherOptions(term: string = ""): Promise<TeacherOption[]> {
        return this.get<TeacherOption[]>("/teacher-options", {term});
    }

    saveAcademicAssignment(courseId: string | number, request: CourseAcademicAssignmentRequest): Promise<CourseAcademicAssignment> {
        return this.put<CourseAcademicAssignment>(`/${courseId}/academic-assignments`, request);
    }

    updateAcademicAssignment(courseId: string | number, assignmentId: number, request: CourseAcademicAssignmentRequest): Promise<CourseAcademicAssignment> {
        return this.put<CourseAcademicAssignment>(`/${courseId}/academic-assignments/${assignmentId}`, request);
    }

    deleteAcademicAssignment(courseId: string | number, assignmentId: number): Promise<unknown> {
        return this.delete<unknown>(`/${courseId}/academic-assignments/${assignmentId}`);
    }
}
