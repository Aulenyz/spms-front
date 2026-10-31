/**
 * Helpers nativos que reemplazan las funciones de lodash usadas en el proyecto.
 */

export const isNil = (value: unknown): value is null | undefined => value === null || value === undefined;

export const isDate = (value: unknown): value is Date => value instanceof Date;

/** Vacío: null/undefined, string/array de longitud 0, Map/Set sin elementos u objeto sin propiedades propias. */
export const isEmpty = (value: unknown): boolean => {
    if (isNil(value)) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (typeof value === 'object') return Object.keys(value as object).length === 0;
    return true;
};

export const omitBy = <T extends object>(object: T | null | undefined, predicate: (value: never, key: string) => boolean): Partial<T> => {
    const result: Partial<T> = {};
    if (isNil(object)) return result;
    (Object.keys(object) as Array<keyof T & string>).forEach((key) => {
        if (!predicate(object[key] as never, key)) result[key] = object[key];
    });
    return result;
};

/** Comparación superficial de dos objetos planos. */
export const shallowEqual = (a: object | null | undefined, b: object | null | undefined): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
};
