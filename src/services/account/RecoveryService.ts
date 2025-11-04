import {BaseService} from "../BaseService.ts";
import {SendRecoverRequest} from "../../domain/model/account/RecoverPassword.ts";

export class AccountRecoverService extends BaseService {

    private static factory: AccountRecoverService = new AccountRecoverService();

    static get instance(): AccountRecoverService {
        return AccountRecoverService.factory;
    }

    constructor() {
        super('/account/recover');
    }

    send(request: SendRecoverRequest) {
        return super.post<void>('/send', request);
    }
}