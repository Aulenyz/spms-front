import { BaseModel } from "../BaseModel";
import {Organization} from "./user.ts";

export interface UserOrganizationDTO extends BaseModel {
    organization: Organization;
}
