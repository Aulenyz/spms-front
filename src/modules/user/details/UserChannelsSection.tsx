import {DetailSection} from "../../../components/ui/detail/DetailSection.tsx";
import {StatusBadge} from "../../../components/ui/detail/StatusBadge.tsx";
import {CHANNEL_ICON, useUserChannels} from "./useUserChannels.ts";

/**
 * Apps que el administrador habilita a este usuario en la organización activa (panel web, app de profesores).
 * Nadie entra a una app que no tenga habilitada; al habilitarla, el usuario recibe un correo. La app de profesores
 * solo se puede habilitar si su rol tiene el permiso de docente; al quitar una app, deja de poder entrar en la
 * siguiente petición.
 */
export const UserChannelsSection = ({channels, loading, saving, toggle}: ReturnType<typeof useUserChannels>) => {
    if (!loading && channels.length === 0) return null;

    return (
        <DetailSection title="Aplicaciones"
                       description="Apps a las que este usuario puede entrar en esta organización. Al habilitar una, le llega un correo.">
            {loading ? (
                <p className="text-sm" style={{color: "var(--text-tertiary)"}}>Cargando...</p>
            ) : (
                <ul className="space-y-3">
                    {channels.map((channel) => {
                        const blocked = !channel.eligible && !channel.granted;
                        return (
                            <li key={channel.key} className="flex items-start justify-between gap-4 rounded-[14px] border p-4"
                                style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                <div className="flex min-w-0 gap-3">
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
                                          style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                        <i className={`fa ${CHANNEL_ICON[channel.key] ?? "fa-grip"}`}/>
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <strong className="text-sm" style={{color: "var(--text-primary)"}}>{channel.name}</strong>
                                            <StatusBadge active={channel.granted} activeLabel="Habilitada" inactiveLabel="Sin acceso"/>
                                        </div>
                                        {channel.description && (
                                            <p className="mt-1 text-sm leading-5" style={{color: "var(--text-secondary)"}}>{channel.description}</p>
                                        )}
                                        {!channel.eligible && (
                                            <p className="mt-2 text-xs" style={{color: "var(--warning)"}}>
                                                <i className="fa fa-triangle-exclamation mr-1"/>
                                                Su rol no tiene el permiso de docente. Asígnale un rol de docente para habilitarla.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <input type="checkbox" className="toggle toggle-primary mt-1 shrink-0"
                                       checked={channel.granted}
                                       disabled={blocked || saving === channel.key}
                                       onChange={(event) => void toggle(channel, event.target.checked)}
                                       aria-label={`Acceso a ${channel.name}`}/>
                            </li>
                        );
                    })}
                </ul>
            )}
        </DetailSection>
    );
};
