import {BaseService} from "../BaseService.ts";
import {SendRecoverRequest} from "../../domain/model/account/RecoverPassword.ts";
import {LocalStorage} from "../../utils/LocalStorage.ts";
import {StorageItem} from "../../domain/types/StorageItem.ts";

export class AccountRecoverService extends BaseService {

    private static factory: AccountRecoverService = new AccountRecoverService();

    static get instance(): AccountRecoverService {
        return AccountRecoverService.factory;
    }

    constructor() {
        super('/account/recover');
    }

    send(request: SendRecoverRequest) {
        LocalStorage.set(StorageItem.CompanyRNC, request.company)
        return super.post<void>('/send', request);
    }
}