import {Specialization} from "../../domain/model/course/Course.ts";
import {BaseService} from "../BaseService.ts";

export class SpecializationService extends BaseService<Specialization> {

    private static factory: SpecializationService = new SpecializationService();

    static get instance(): SpecializationService {
        return SpecializationService.factory;
    }

    constructor() {
        super('/specializations');
    }
}