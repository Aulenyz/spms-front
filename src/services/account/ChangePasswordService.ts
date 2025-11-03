import {BaseService} from "../BaseService.ts";

export class ChangePasswordService extends BaseService {
    private static factory: ChangePasswordService = new ChangePasswordService();

    static get instance(): ChangePasswordService {
        return ChangePasswordService.factory;
    }

    constructor() {
        super('/account/recover/change');
    }
}