import {Optional} from "../types/steoreotype.ts";

export interface SearchInfo {
    document: string;
    principal: string;
    secondary: Optional<string>;
    ternary: Optional<string>;
    type: SearchType;
    description: string;
    typeSpn: string;
}

export enum SearchType {
    Employee = 'EMPLOYEE',
    Place = 'PLACE',
    Position = 'POSITION',
    Zone = 'ZONE',
    All = 'ALL'
}

export const searchTypes: Record<SearchType, string> = {
    [SearchType.Employee]: 'Empleados',
    [SearchType.Position]: 'Posiciones',
    [SearchType.Place]: 'Clientes',
    [SearchType.Zone]: 'Zona',
    [SearchType.All]: 'Todos',
}
