import {useEffect, useState} from "react";
import {toast} from "react-toastify";

import {UserChannel} from "../../../domain/model/user/UserChannel.ts";
import {UserService} from "../../../services/user/UserService.ts";

const userService = UserService.instance;

const errorMessage = (error: unknown, fallback: string): string => {
    const message = typeof error === "object" && error !== null ? (error as {message?: unknown}).message : undefined;
    return typeof message === "string" && message.trim() ? message : fallback;
};

export const CHANNEL_ICON: Record<string, string> = {
    WEB: "fa-desktop",
    TEACHER_APP: "fa-mobile-screen-button",
};

/**
 * Apps del usuario en la organización activa y cómo habilitarlas o quitarlas. Lo comparten la sección y el menú de
 * opciones del detalle, así ambos muestran lo mismo.
 */
export const useUserChannels = (userId?: number | string) => {
    const [channels, setChannels] = useState<UserChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        userService.channels(userId)
            .then((response) => setChannels(response ?? []))
            .catch((error) => toast.error(errorMessage(error, "No se pudieron cargar las aplicaciones del usuario.")))
            .finally(() => setLoading(false));
    }, [userId]);

    const toggle = async (channel: UserChannel, enabled: boolean) => {
        if (!userId) return;
        setSaving(channel.key);
        try {
            const updated = enabled
                ? await userService.grantChannel(userId, channel.key)
                : await userService.revokeChannel(userId, channel.key);
            setChannels((current) => current.map((item) => item.key === updated.key ? updated : item));
            toast.success(enabled ? `${channel.name} habilitada. Le enviamos un correo al usuario.` : `${channel.name} deshabilitada.`);
        } catch (error) {
            toast.error(errorMessage(error, "No se pudo actualizar el acceso."));
        } finally {
            setSaving(null);
        }
    };

    return {channels, loading, saving, toggle};
};
