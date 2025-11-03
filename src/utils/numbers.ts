import {Optional} from "../domain/types/steoreotype.ts";

export const multiply = (...numbers: Array<Optional<number>>): number => {
    return numbers.reduce((a: Optional<number>, b: Optional<number>) => ((a ?? 0) * (b ?? 0)), 1) ?? 0;
}