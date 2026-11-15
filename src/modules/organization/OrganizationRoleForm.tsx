import {FormEvent, useMemo, useState} from "react";
import {toast} from "react-toastify";
import {useQuery} from "@tanstack/react-query";
import {AssistantService} from "../../services/assistant/AssistantService.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";

export const OrganizationRoleForm = ({organizationId, onSaved}: {organizationId: number; onSaved: () => void}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // La IA escribe la descripción a partir del nombre solo cuando se pulsa el botón.
    const {data: assistant} = useQuery({queryKey: ["assistant", "status"], queryFn: ({signal}) => AssistantService.instance.withSignal(signal).status(), staleTime: Infinity, meta: {silent: true}});
    const [suggesting, setSuggesting] = useState(false);
    const [suggested, setSuggested] = useState(false);
    const [manual, setManual] = useState(false);
    const canSuggest = Boolean(assistant?.enabled) && name.trim().length >= 3;
    const suggest = async () => { if (!canSuggest) return; setSuggesting(true); try { const {description: text} = await AssistantService.instance.describe("role", name.trim()); setDescription(text); setManual(false); setSuggested(true); } catch { /* si la IA no responde, se escribe a mano */ } finally { setSuggesting(false); } };
    const canSubmit = useMemo(() => Boolean(name.trim() && description.trim()), [name, description]);
    const submit = async () => { if (!canSubmit || submitting) return; setSubmitting(true); try { await OrganizationAdminService.instance.createRole(organizationId, {name: name.trim(), description: description.trim()}); toast.success("Rol creado."); onSaved(); } catch (error: any) { toast.error(error?.message ?? "No se pudo crear el rol."); } finally { setSubmitting(false); } };
    return <form className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(); }}><div className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}><div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>Datos principales</div><div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>Crea un rol que estará disponible únicamente para esta organización.</div></div><div className="space-y-1"><label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Nombre*</label><label className="input input-sm w-full"><i className="fa fa-user-shield me-1"/><input placeholder="Nombre del rol" value={name} onChange={(event) => setName(event.target.value)}/></label></div><div className="space-y-1"><label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Descripción*</label><div className="flex items-start gap-2"><textarea className="input min-h-[120px] w-full min-w-0 flex-1 resize-none py-3" placeholder={assistant?.enabled ? "Escríbela o pulsa el botón para que la IA la sugiera" : "Describe el objetivo de este rol"} value={description} onChange={(event) => { setDescription(event.target.value); setManual(true); }}/>{assistant?.enabled && (
                    <button type="button" className="btn btn-sm btn-square mt-1 shrink-0" disabled={!canSuggest || suggesting}
                            title={suggested ? "Otra sugerencia con IA" : "Sugerir con IA"} aria-label="Sugerir descripción con IA"
                            onClick={() => void suggest()}>
                        <i className={`fa ${suggesting ? "fa-spinner fa-spin" : "fa-wand-magic-sparkles"}`} style={{color: "var(--accent)"}}/>
                    </button>
                )}</div><p className="min-h-[1.25rem] text-xs" style={{color: "var(--text-tertiary)"}}>{suggesting ? "La IA está escribiendo la descripción…" : suggested && !manual ? "Sugerida por IA; puedes editarla." : ""}</p></div><div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2"><button type="button" className="btn btn-sm" onClick={onSaved} disabled={submitting}>Cancelar</button><button type="submit" className="btn btn-sm btn-primary" disabled={!canSubmit || submitting}>{submitting ? "Guardando..." : "Crear rol"}<i className="fa fa-save ms-2"/></button></div></form>;
};
