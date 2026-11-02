import {BaseService} from "../BaseService.ts";
import {CourseTemplate} from "../../domain/model/course/Course.ts";
import {TemplateCloneTarget, TemplatePeriod} from "../../domain/model/course/EvaluationPeriod.ts";
import {Subject} from "../../domain/model/course/Subject.ts";
import {TemplateSlot} from "../../modules/course/template/schedule.ts";

export type TeacherOption = {id: number; name: string; email: string; image?: string};
export type TemplateSection = {id: number; division: string; teacher?: TeacherOption | null; slots: TemplateSlot[]};
export type TemplateSubject = {
    id: number;
    subjectId: number;
    name: string;
    code?: string;
    description?: string;
    sections: TemplateSection[];
};
export type TemplateSubjectRequest = {
    subjectId: number;
    sections: {division: string; teacherId: number; slots: TemplateSlot[]}[];
};

export class CourseTemplateService extends BaseService<CourseTemplate> {

    private static factory: CourseTemplateService = new CourseTemplateService();

    static get instance(): CourseTemplateService {
        return CourseTemplateService.factory;
    }

    constructor() {
        super('/course/templates');
    }

    /** Activa o inactiva el curso base; inactivo ya no genera cursos. */
    updateStatus(id: string | number): Promise<CourseTemplate> {
        return this.put<CourseTemplate>(`/${id}/status`);
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

    /** Agrega la materia o reemplaza su plan (profesor y horario por sección). */
    saveTemplateSubject(id: string | number, request: TemplateSubjectRequest): Promise<TemplateSubject> {
        return this.put<TemplateSubject>(`/${id}/template-subjects`, request);
    }

    teacherOptions(id: string | number, term: string = ""): Promise<TeacherOption[]> {
        return this.get<TeacherOption[]>(`/${id}/teacher-options`, {term});
    }

    deleteTemplateSubject(templateSubjectId: number): Promise<unknown> {
        return this.delete<unknown>(`/template-subjects/${templateSubjectId}`);
    }

    /** Períodos de evaluación planificados en el curso base (día y mes). */
    evaluationPeriods(id: string | number): Promise<TemplatePeriod[]> {
        return this.get<TemplatePeriod[]>(`/${id}/evaluation-periods`);
    }

    /** Reemplaza todos los períodos del curso base, en orden. */
    saveEvaluationPeriods(id: string | number, periods: TemplatePeriod[]): Promise<TemplatePeriod[]> {
        return this.put<TemplatePeriod[]>(`/${id}/evaluation-periods`, {periods});
    }

    /** Da los períodos a los cursos del año actual de este curso base que no tengan; devuelve esas secciones. */
    applyEvaluationPeriods(id: string | number): Promise<string[]> {
        return this.post<string[]>(`/${id}/evaluation-periods/apply`);
    }

    /** Los otros cursos base de la organización, a los que se pueden clonar los períodos. */
    evaluationPeriodCloneTargets(id: string | number): Promise<TemplateCloneTarget[]> {
        return this.get<TemplateCloneTarget[]>(`/${id}/evaluation-periods/clone-targets`);
    }

    /** Copia los períodos a esos cursos base (reemplaza los que tenían); devuelve sus nombres. */
    cloneEvaluationPeriods(id: string | number, templateIds: number[]): Promise<string[]> {
        return this.post<string[]>(`/${id}/evaluation-periods/clone`, {templateIds});
    }
}
