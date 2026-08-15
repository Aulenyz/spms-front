import {BaseModel} from "../BaseModel";
import {SelectOption} from "../../types/steoreotype.ts";

export interface Period extends BaseModel {
    name?: string;
    isActive?: boolean;
    start?: string;
    end?: string;
}

export const PeriodOptionMapper = ({id: value, name}: Period): SelectOption => ({value, description: name ?? '',});

