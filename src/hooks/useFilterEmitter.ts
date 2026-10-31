import {useEffect, useRef} from "react";
import {shallowEqual} from "../utils/lang.ts";

/**
 * Emite `onFilter(value)` con debounce solo cuando el valor cambia (comparación superficial)
 * respecto al último emitido. El valor inicial NO se emite: la página ya consulta con sus filtros iniciales.
 */
export const useFilterEmitter = <T extends object>(value: T, onFilter: (value: T) => void, delay: number = 250): void => {
    const lastEmitted = useRef<T>(value);
    const callback = useRef(onFilter);

    useEffect(() => {
        callback.current = onFilter;
    }, [onFilter]);

    const key: string = JSON.stringify(value);
    useEffect(() => {
        if (shallowEqual(lastEmitted.current, value)) return;
        const timeout = window.setTimeout(() => {
            lastEmitted.current = value;
            callback.current(value);
        }, delay);
        return () => window.clearTimeout(timeout);
        // `key` representa el contenido de `value`; evita re-ejecutar por identidad de objeto.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, delay]);
};
