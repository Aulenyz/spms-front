import {RefObject, useEffect} from "react";

/** Cierra un menú flotante al hacer clic fuera de `ref` o al presionar Escape. */
export const useDismiss = (ref: RefObject<HTMLElement>, onDismiss: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
        };
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") onDismiss();
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, [ref, onDismiss]);
};
