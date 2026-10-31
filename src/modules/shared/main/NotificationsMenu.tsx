import {memo, useEffect, useState} from "react";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";

/** Campana de notificaciones; se abre también con `?notification=show`. */
export const NotificationsMenu = memo(() => {
    const {notification} = useQueryParams();
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (notification === "show") {
            setShowNotifications(true);
        }
    }, [notification]);

    // Antes solo se cerraba con Escape; se mantiene ese comportamiento (clic fuera no la cierra).
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") setShowNotifications(false);
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowNotifications((currentValue) => !currentValue)}
                className="icon-button relative"
                title="Notificaciones"
            >
                <i className="fa fa-bell"/>
                <span className="notification-dot"/>
            </button>

            {showNotifications && (
                <div className="floating-panel right-0 mt-3 w-72">
                    <div className="floating-panel-header">Notificaciones</div>
                    <div className="space-y-3 p-3">
                        <div className="notification-card">
                            <strong>Cierre de caja</strong>
                            <p>Dos pagos quedaron pendientes de validación manual.</p>
                        </div>
                        <div className="notification-card">
                            <strong>Actividad reciente</strong>
                            <p>Hay movimientos nuevos en inscripciones y pagos del día.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
