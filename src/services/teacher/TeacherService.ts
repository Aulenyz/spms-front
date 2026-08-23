import {BaseService} from "../BaseService.ts";
import {GradeType, Specialization, WeekDay} from "../../domain/model/course/Course.ts";
import {Subject} from "../../domain/model/course/Subject.ts";

export type TeacherScheduleSlot = {id?: number; dayOfWeek: WeekDay; startsAt: string; endsAt: string};
export type TeacherClassFilter = {term?: string; courseId?: string; subjectId?: string; division?: string};
export type TeacherClass = {
    id: number;
    courseId: number;
    courseName: string;
    division: string;
    type: GradeType;
    specialization?: Specialization | null;
    subject: Subject;
    schedule: TeacherScheduleSlot[];
};

export class TeacherService extends BaseService<TeacherClass> {
    private static factory = new TeacherService();

    static get instance(): TeacherService {
        return TeacherService.factory;
    }

    constructor() {
        super("/teacher/me");
    }

    classes(filters: TeacherClassFilter = {}): Promise<TeacherClass[]> {
        return this.get<TeacherClass[]>("/classes", filters);
    }

    schedule(filters: TeacherClassFilter = {}): Promise<TeacherClass[]> {
        return this.get<TeacherClass[]>("/schedule", filters);
    }

    async exportSchedule(filters: TeacherClassFilter = {}): Promise<void> {
        const blob = await this.get<Blob>("/schedule/export", filters);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "horario-semanal.pdf";
        link.click();
        URL.revokeObjectURL(url);
    }
}
