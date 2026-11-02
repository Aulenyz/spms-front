/** Estado del período respecto a hoy. */
export type EvaluationPeriodState = "UPCOMING" | "OPEN" | "ENDED";

/** Período de evaluación de un curso (P1, P2...). */
export type EvaluationPeriod = {
    id: number;
    code: string;
    name: string;
    sequence: number;
    /** yyyy-mm-dd */
    startsAt: string;
    endsAt: string;
    state: EvaluationPeriodState;
    /** Ya tiene calificaciones o una publicación: no se puede eliminar. */
    used: boolean;
};

export type EvaluationPeriodRequest = {
    name?: string;
    startsAt: string;
    endsAt: string;
};

export const EvaluationPeriodStateLabel: Record<EvaluationPeriodState, string> = {
    UPCOMING: "Próximo",
    OPEN: "En curso",
    ENDED: "Finalizado",
};

/** Período planificado en un curso base: día y mes, sin año, para que sirva cada año escolar. */
export type TemplatePeriod = {
    id?: number;
    code?: string;
    name: string;
    sequence?: number;
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
};

/** Curso base del mismo tipo al que se pueden clonar los períodos, con cuántos tiene ahora. */
export type TemplateCloneTarget = {
    id: number;
    name: string;
    specialization?: string | null;
    active: boolean;
    periods: number;
};
