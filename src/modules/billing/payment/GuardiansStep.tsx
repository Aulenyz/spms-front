import {FormEvent, useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import {StudentService} from "../../../services/student/StudentService.ts";
import {GuardianService} from "../../../services/student/guardian/GuardianService.ts";
import {Guardian, Relationship, RelationshipLabel, StudentGuardian} from "../../../domain/student/Guardian.ts";
import {PersonRef} from "../../../domain/billing/Invoice.ts";

export const studentGuardiansKey = (studentId?: number) => ["students", "guardians", studentId ?? null] as const;

type Props = {
    student: PersonRef;
    payerId?: number;
    onPayer: (guardian: Guardian | undefined) => void;
};

const EMPTY = {document: "", firstname: "", lastname: "", phone: "", email: "", relationship: "" as Relationship | ""};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Representantes del estudiante: se cargan los que ya tiene, se pueden agregar varios (nuevos o ya
 * registrados en el colegio, buscándolos por cédula) y se elige quién paga. Es obligatorio.
 */
export const GuardiansStep = ({student, payerId, onPayer}: Props) => {
    const queryClient = useQueryClient();
    const [adding, setAdding] = useState(false);
    const [values, setValues] = useState(EMPTY);
    const [existing, setExisting] = useState<Guardian | null>(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [touched, setTouched] = useState(false);

    const guardiansQuery = useQuery({
        queryKey: studentGuardiansKey(student.id),
        queryFn: () => StudentService.instance.guardians(student.id),
        meta: {errorMessage: "No se pudieron cargar los representantes."},
    });
    const guardians: StudentGuardian[] = guardiansQuery.data ?? [];

    // Si ya tiene representantes, el primero paga por defecto; si no tiene, se abre el formulario.
    useEffect(() => {
        if (!guardiansQuery.data) return;
        if (guardiansQuery.data.length === 0) setAdding(true);
        else if (!payerId || !guardiansQuery.data.some((item) => item.guardian.id === payerId)) onPayer(guardiansQuery.data[0].guardian);
    }, [guardiansQuery.data, payerId, onPayer]);

    const errors = {
        document: values.document.trim().length < 5 ? "Escribe la cédula." : "",
        firstname: !existing && values.firstname.trim().length < 2 ? "Escribe el nombre." : "",
        lastname: !existing && values.lastname.trim().length < 2 ? "Escribe el apellido." : "",
        phone: !existing && values.phone.trim().length < 7 ? "Escribe un teléfono válido." : "",
        email: !existing && values.email.trim() && !EMAIL.test(values.email.trim()) ? "El correo no es válido." : "",
        relationship: !values.relationship ? "Elige el parentesco." : "",
    };
    const valid = Object.values(errors).every((error) => !error);
    const set = (key: keyof typeof EMPTY, value: string) => setValues((current) => ({...current, [key]: value}));

    const lookup = async () => {
        const document = values.document.trim();
        if (document.length < 5 || existing?.document === document) return;
        setLookingUp(true);
        try {
            setExisting(await GuardianService.instance.findByDocument(document));
        } catch {
            setExisting(null);
        } finally {
            setLookingUp(false);
        }
    };

    const link = useMutation({
        mutationFn: () => StudentService.instance.linkGuardian(student.id, existing
            ? {guardianId: existing.id, relationship: values.relationship as Relationship}
            : {
                relationship: values.relationship as Relationship,
                guardian: {
                    document: values.document.trim(), firstname: values.firstname.trim(), lastname: values.lastname.trim(),
                    phone: values.phone.trim(), email: values.email.trim() || undefined,
                },
            }),
        onSuccess: (list) => {
            queryClient.setQueryData(studentGuardiansKey(student.id), list);
            const added = list.find((item) => item.guardian.document === values.document.trim());
            if (added) onPayer(added.guardian);
            toast.success("Representante agregado.");
            setValues(EMPTY);
            setExisting(null);
            setTouched(false);
            setAdding(false);
        },
        onError: (error) => toast.error((error as {message?: string})?.message ?? "No se pudo agregar el representante."),
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        setTouched(true);
        if (valid) link.mutate();
    };

    const error = (key: keyof typeof errors) => touched && errors[key]
        ? <span className="mt-1 block text-xs" style={{color: "var(--danger)"}}>{errors[key]}</span> : null;
    const label = (text: string) => <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>{text}</span>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold" style={{color: "var(--text-primary)"}}>Representantes de {student.name}</h3>
                    <p className="text-xs" style={{color: "var(--text-tertiary)"}}>Obligatorio. Elige quién paga; puede tener varios.</p>
                </div>
                {!adding && (
                    <button type="button" className="btn btn-sm" onClick={() => setAdding(true)}>
                        <i className="fa fa-user-plus"/>Agregar representante
                    </button>
                )}
            </div>

            {guardiansQuery.isPending ? (
                <p className="text-sm" style={{color: "var(--text-secondary)"}}><i className="fa fa-spinner fa-spin me-2"/>Cargando representantes…</p>
            ) : guardians.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Quién paga">
                    {guardians.map(({guardian, relationship}) => {
                        const selected = guardian.id === payerId;
                        return (
                            <button key={guardian.id} type="button" role="radio" aria-checked={selected} onClick={() => onPayer(guardian)}
                                    className="flex items-center gap-3 rounded-2xl border p-3 text-left transition"
                                    style={{borderColor: selected ? "var(--accent)" : "var(--border-soft)", background: selected ? "var(--accent-soft)" : "var(--surface)"}}>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                                      style={{background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                    {guardian.firstname[0]}{guardian.lastname[0]}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <strong className="block truncate text-sm" style={{color: "var(--text-primary)"}}>{guardian.firstname} {guardian.lastname}</strong>
                                    <span className="block truncate text-xs" style={{color: "var(--text-tertiary)"}}>
                                        {RelationshipLabel[relationship] ?? relationship} · {guardian.document}{guardian.phone && ` · ${guardian.phone}`}
                                    </span>
                                </span>
                                <span className="text-xs font-semibold" style={{color: selected ? "var(--accent)" : "var(--text-tertiary)"}}>
                                    {selected ? <><i className="fa fa-circle-check me-1"/>Paga</> : "Elegir"}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {adding && (
                <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                    <h4 className="text-sm font-bold" style={{color: "var(--text-primary)"}}>Nuevo representante</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                            {label("Cédula*")}
                            <input className="input input-bordered input-sm w-full" value={values.document} maxLength={20} autoFocus
                                   placeholder="001-0000000-0"
                                   onChange={(event) => {
                                       set("document", event.target.value);
                                       if (existing) setExisting(null);
                                   }}
                                   onBlur={() => void lookup()}/>
                            {lookingUp && <span className="mt-1 block text-xs" style={{color: "var(--text-tertiary)"}}>Buscando…</span>}
                            {error("document")}
                        </label>
                        <label className="block">
                            {label("Parentesco*")}
                            <select className="select select-bordered select-sm w-full" value={values.relationship}
                                    onChange={(event) => set("relationship", event.target.value)}>
                                <option value="">Elige…</option>
                                {Object.values(Relationship).map((value) => <option key={value} value={value}>{RelationshipLabel[value]}</option>)}
                            </select>
                            {error("relationship")}
                        </label>
                    </div>

                    {existing ? (
                        <p className="rounded-xl px-4 py-3 text-sm" style={{background: "var(--success-soft)", color: "var(--success)"}}>
                            <i className="fa fa-circle-check me-2"/>
                            Ya está registrado: <strong>{existing.firstname} {existing.lastname}</strong>{existing.phone && ` · ${existing.phone}`}. Solo indica el parentesco.
                        </p>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                {label("Nombre*")}
                                <input className="input input-bordered input-sm w-full" value={values.firstname} maxLength={64}
                                       onChange={(event) => set("firstname", event.target.value)}/>
                                {error("firstname")}
                            </label>
                            <label className="block">
                                {label("Apellido*")}
                                <input className="input input-bordered input-sm w-full" value={values.lastname} maxLength={64}
                                       onChange={(event) => set("lastname", event.target.value)}/>
                                {error("lastname")}
                            </label>
                            <label className="block">
                                {label("Teléfono*")}
                                <input className="input input-bordered input-sm w-full" value={values.phone} maxLength={32} inputMode="tel"
                                       placeholder="809-000-0000" onChange={(event) => set("phone", event.target.value)}/>
                                {error("phone")}
                            </label>
                            <label className="block">
                                {label("Correo")}
                                <input type="email" className="input input-bordered input-sm w-full" value={values.email} maxLength={96}
                                       placeholder="Opcional" onChange={(event) => set("email", event.target.value)}/>
                                {error("email")}
                            </label>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        {guardians.length > 0 && (
                            <button type="button" className="btn btn-sm" onClick={() => {
                                setAdding(false);
                                setValues(EMPTY);
                                setExisting(null);
                                setTouched(false);
                            }}>Cancelar</button>
                        )}
                        <button type="submit" className="btn btn-sm btn-primary" disabled={link.isPending || lookingUp}>
                            {link.isPending ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-user-plus"/>}
                            {existing ? "Vincular representante" : "Agregar representante"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
