import {BaseService} from "./BaseService";

const baseRodalURL: string = 'https://rodal.tech/api/v1';

export class RodalService extends BaseService {
    private static factory: RodalService = new RodalService();

    static get instance(): RodalService {
        return RodalService.factory;
    }

    constructor() {
        super(baseRodalURL, true);
    }

    getRNCInfo(rnc: string) {
        return super.get('/companies/rnc-info', {rnc});
    }

    async isRNCValid(rnc?: string) {
        return this.getRNCInfo(rnc ?? '').then(() => true, () => false);
    }
}