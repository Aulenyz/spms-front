import {FormEvent, useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";
import {DropdownSelect} from "../../components/io/input/DropdownSelect.tsx";
import {SelectOption} from "../../components/io/output/Select.tsx";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";

export const OrganizationInvitationForm = ({organizationId, onSaved}: {organizationId: number; onSaved: () => void}) => {
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState<number>();
    const [roles, setRoles] = useState<SelectOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { OrganizationAdminService.instance.roles(organizationId).then((page) => setRoles(page.content.map((role) => ({value: role.id, description: role.name})))).catch(() => toast.error("No se pudieron cargar los roles.")); }, [organizationId]);
    const canSubmit = useMemo(() => /\S+@\S+\.\S+/.test(email) && Boolean(roleId), [email, roleId]);
    const submit = async () => { if (!canSubmit || submitting || !roleId) return; setSubmitting(true); try { await OrganizationAdminService.instance.invite(organizationId, {email: email.trim(), roleId}); toast.success("Invitación enviada."); onSaved(); } catch (error: any) { toast.error(error?.message ?? "No se pudo enviar la invitación."); } finally { setSubmitting(false); } };
    return <form className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(); }}><div className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}><div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>Nuevo usuario</div><div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>Envía una invitación para que el usuario se una a esta organización.</div></div><div className="space-y-1"><label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Correo*</label><label className="input input-sm w-full"><i className="fa fa-envelope me-1"/><input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(event) => setEmail(event.target.value)}/></label></div><div className="space-y-1"><label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Rol*</label><DropdownSelect text="Seleccionar rol" hasError={false} options={roles} value={roleId} onSelect={(value) => setRoleId(Number(value))} className="w-full"/></div><div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2"><button type="button" className="btn btn-sm" onClick={onSaved} disabled={submitting}>Cancelar</button><button type="submit" className="btn btn-sm btn-primary" disabled={!canSubmit || submitting}>{submitting ? "Enviando..." : "Enviar invitación"}<i className="fa fa-paper-plane ms-2"/></button></div></form>;
};
