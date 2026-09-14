import {ChangeEvent, FormEvent, useMemo, useRef, useState} from "react";
import {toast} from "react-toastify";
import {Organization} from "../../domain/model/organization/Organization.ts";
import {OrganizationAdminService} from "../../services/organization/OrganizationAdminService.ts";
import {PublicFileService} from "../../services/public/PublicFileService.ts";

type OrganizationValues = Pick<Organization, "name" | "document" | "logo">;
const fileService = PublicFileService.instance;

export const OrganizationForm = ({initial, onSaved}: {initial: Organization | null; onSaved: () => void}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initial?.logo ?? "");
    const [values, setValues] = useState<OrganizationValues>({name: initial?.name ?? "", document: initial?.document ?? "", logo: initial?.logo ?? ""});
    const [errors, setErrors] = useState<Partial<Record<keyof OrganizationValues, string>>>({});
    const isEdit = Boolean(initial?.id);
    const canSubmit = useMemo(() => Boolean(values.name.trim() && values.document.trim()) && !uploading, [values, uploading]);
    const setField = (key: keyof OrganizationValues, value: string) => { setValues((current) => ({...current, [key]: value})); setErrors((current) => ({...current, [key]: undefined})); };
    const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setPreview(URL.createObjectURL(file));
        try {
            const logo = await fileService.upload(file);
            setField("logo", logo);
            toast.success("Logo cargado.");
        } catch (error: any) {
            setPreview(values.logo ?? "");
            toast.error(error?.message ?? "No se pudo cargar el logo.");
        } finally { setUploading(false); }
    };
    const submit = async () => {
        if (submitting || uploading) return;
        const nextErrors: Partial<Record<keyof OrganizationValues, string>> = {};
        if (!values.name.trim()) nextErrors.name = "El nombre es obligatorio.";
        if (!values.document.trim()) nextErrors.document = "El documento es obligatorio.";
        if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
        setSubmitting(true);
        try {
            const payload = {name: values.name.trim(), document: values.document.trim(), logo: values.logo || undefined};
            if (initial?.id) await OrganizationAdminService.instance.updateOrganization(initial.id, payload); else await OrganizationAdminService.instance.createOrganization(payload);
            toast.success(isEdit ? "Organización actualizada." : "Organización creada.");
            onSaved();
        } catch (error: any) { toast.error(error?.message ?? "No se pudo guardar la organización."); } finally { setSubmitting(false); }
    };
    return <form className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(); }}>
        <div className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}><div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>Datos principales</div><div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>{isEdit ? "Actualiza los datos generales de la organización." : "Registra una organización; se creará activa por defecto."}</div></div>
        <div className="flex items-center gap-4 rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>{preview ? <img src={preview} alt="Vista previa del logo" className="h-full w-full object-cover"/> : <i className="fa fa-building text-xl" style={{color: "var(--text-tertiary)"}}/>}</div><div className="min-w-0"><div className="text-sm font-semibold" style={{color: "var(--text-primary)"}}>Logo de la organización</div><p className="mt-1 text-xs" style={{color: "var(--text-secondary)"}}>Selecciona una imagen; se cargará antes de guardar.</p><button type="button" className="btn btn-sm mt-2" disabled={uploading} onClick={() => inputRef.current?.click()}><i className={`fa ${uploading ? "fa-spinner fa-spin" : "fa-upload"} me-1`}/>{uploading ? "Cargando..." : preview ? "Cambiar imagen" : "Subir imagen"}</button><input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFile(event)}/></div></div>
        <div className="space-y-1"><label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Nombre*</label><label className="input input-sm w-full"><i className="fa fa-building me-1"/><input placeholder="Nombre de la organización" value={values.name} onChange={(event) => setField("name", event.target.value)}/></label>{errors.name && <p className="text-xs font-semibold text-red-500">{errors.name}</p>}</div>
        <div className="space-y-1"><label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Documento*</label><label className="input input-sm w-full"><i className="fa fa-id-card me-1"/><input placeholder="RNC o documento" value={values.document} onChange={(event) => setField("document", event.target.value)}/></label>{errors.document && <p className="text-xs font-semibold text-red-500">{errors.document}</p>}</div>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2"><button type="button" className="btn btn-sm" onClick={onSaved} disabled={submitting || uploading}>Cancelar</button><button type="submit" className="btn btn-sm btn-primary" disabled={submitting || !canSubmit}>{submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear organización"}<i className="fa fa-check ms-2"/></button></div>
    </form>;
};
