import {BaseService} from "../BaseService.ts";

export interface PeriodConfig {
    day?: number;
    month?: number;
    end?: string; // ISO date
    mode?: string;
    start?: string; // ISO date
    enabled?: boolean;
}

export class PeriodConfigService extends BaseService<PeriodConfig> {
    private static factory: PeriodConfigService = new PeriodConfigService();

    static get instance(): PeriodConfigService {
        return PeriodConfigService.factory;
    }

    constructor() {
        super("/periods/configs");
    }

    after(): Promise<PeriodConfig> {
        return this.get<PeriodConfig>("/after");
    }
}

