import {useEffect, useState} from "react";

/** Devuelve `value` luego de `delay` ms sin cambios. */
export const useDebouncedValue = <T, >(value: T, delay: number = 300): T => {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const timeout = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(timeout);
    }, [value, delay]);
    return debounced;
};
