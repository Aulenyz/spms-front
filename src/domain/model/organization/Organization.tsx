import {BaseModel} from "../BaseModel";
import {SelectOption} from "../../types/steoreotype.ts";

export interface Period extends BaseModel {
    name?: string;
    isActive?: boolean;
}

export const PeriodOptionMapper = ({id: value, name}: Period): SelectOption => ({value, description: name ?? '',});


