import {BaseService} from "../BaseService.ts";
import {CourseTemplate} from "../../domain/model/course/Course.ts";
import {Subject} from "../../domain/model/course/Subject.ts";

export type TeacherOption = {id: number; name: string; email: string; image?: string};
export type WeekDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
export type ScheduleSlot = {id?: number; dayOfWeek: WeekDay; startsAt: string; endsAt: string};
export type AcademicAssignment = {
    id: number;
    division: string;
    subject: Subject;
    templateSubjectId: number;
    teacher?: TeacherOption;
    schedule: ScheduleSlot[];
};
export type AcademicAssignmentRequest = {
    division: string;
    templateSubjectId: number;
    teacherId: number;
    schedule: ScheduleSlot[];
};
export type TemplateSubject = {id: number; name: string; description?: string};
export type TeacherAssignment = AcademicAssignment;

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

    academicAssignments(id: string | number): Promise<AcademicAssignment[]> {
        return this.get<AcademicAssignment[]>(`/${id}/academic-assignments`);
    }

    teacherAssignments(id: string | number): Promise<TeacherAssignment[]> {
        return this.get<TeacherAssignment[]>(`/${id}/teacher-assignments`);
    }

    changeTeacher(id: string | number, assignmentId: number, teacherId: number): Promise<TeacherAssignment> {
        return this.put<TeacherAssignment>(`/${id}/teacher-assignments/${assignmentId}/teacher`, {teacherId});
    }

    teacherOptions(id: string | number, term: string = ""): Promise<TeacherOption[]> {
        return this.get<TeacherOption[]>(`/${id}/teacher-options`, {term});
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

    deleteTemplateSubject(id: string | number, templateSubjectId: number): Promise<unknown> {
        return this.delete<unknown>(`/${id}/template-subjects/${templateSubjectId}`);
    }

    saveAcademicAssignment(id: string | number, request: AcademicAssignmentRequest): Promise<AcademicAssignment> {
        return this.put<AcademicAssignment>(`/${id}/academic-assignments`, request);
    }

    updateAcademicAssignment(id: string | number, assignmentId: number, request: AcademicAssignmentRequest): Promise<AcademicAssignment> {
        return this.put<AcademicAssignment>(`/${id}/academic-assignments/${assignmentId}`, request);
    }

    deleteAcademicAssignment(id: string | number, assignmentId: number): Promise<unknown> {
        return this.delete<unknown>(`/${id}/academic-assignments/${assignmentId}`);
    }
}
