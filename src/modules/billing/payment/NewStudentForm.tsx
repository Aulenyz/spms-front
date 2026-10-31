import {FormEvent, useState} from "react";
import {toast} from "react-toastify";
import {StudentService} from "../../../services/student/StudentService.ts";
import {Gender, Genders} from "../../../domain/model/user/user.ts";
import {PersonRef} from "../../../domain/billing/Invoice.ts";

type Props = {
    onCreated: (student: PersonRef) => void;
    onCancel: () => void;
};

const EMPTY = {firstname: "", lastname: "", gender: "" as Gender | "", birthDate: ""};

/** Registro rápido de un estudiante desde la caja; el documento lo asigna el sistema. */
export const NewStudentForm = ({onCreated, onCancel}: Props) => {
    const [values, setValues] = useState(EMPTY);
    const [touched, setTouched] = useState(false);
    const [saving, setSaving] = useState(false);

    const errors = {
        firstname: values.firstname.trim().length < 2 ? "Escribe el nombre (mínimo 2 letras)." : "",
        lastname: values.lastname.trim().length < 2 ? "Escribe el apellido (mínimo 2 letras)." : "",
        gender: !values.gender ? "Elige el género." : "",
        birthDate: values.birthDate && values.birthDate > new Date().toISOString().slice(0, 10) ? "La fecha no puede ser futura." : "",
    };
    const valid = Object.values(errors).every((error) => !error);
    const set = (key: keyof typeof EMPTY, value: string) => setValues((current) => ({...current, [key]: value}));

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setTouched(true);
        if (!valid) return;
        setSaving(true);
        try {
            const student = await StudentService.instance.createStudent({
                firstname: values.firstname.trim(),
                lastname: values.lastname.trim(),
                gender: values.gender as Gender,
                birthDate: values.birthDate,
            });
            toast.success(`Estudiante ${student.firstname} ${student.lastname} registrado.`);
            onCreated({id: student.id, name: `${student.firstname} ${student.lastname}`, document: String(student.document ?? "")});
        } catch (error) {
            toast.error((error as {message?: string})?.message ?? "No se pudo registrar el estudiante.");
        } finally {
            setSaving(false);
        }
    };

    const field = (key: keyof typeof errors) => touched && errors[key]
        ? <span className="mt-1 block text-xs" style={{color: "var(--danger)"}}>{errors[key]}</span> : null;

    return (
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
            <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold" style={{color: "var(--text-primary)"}}>Nuevo estudiante</h4>
                <span className="text-xs" style={{color: "var(--text-tertiary)"}}>El documento se asigna automáticamente</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Nombre*</span>
                    <input className="input input-bordered input-sm w-full" value={values.firstname} maxLength={64} autoFocus
                           onChange={(event) => set("firstname", event.target.value)}/>
                    {field("firstname")}
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Apellido*</span>
                    <input className="input input-bordered input-sm w-full" value={values.lastname} maxLength={64}
                           onChange={(event) => set("lastname", event.target.value)}/>
                    {field("lastname")}
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Género*</span>
                    <select className="select select-bordered select-sm w-full" value={values.gender}
                            onChange={(event) => set("gender", event.target.value)}>
                        <option value="">Elige…</option>
                        {Object.values(Gender).map((gender) => <option key={gender} value={gender}>{Genders[gender]}</option>)}
                    </select>
                    {field("gender")}
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>Fecha de nacimiento</span>
                    <input type="date" className="input input-bordered input-sm w-full" value={values.birthDate}
                           max={new Date().toISOString().slice(0, 10)} onChange={(event) => set("birthDate", event.target.value)}/>
                    {field("birthDate")}
                </label>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-sm" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                    {saving ? <i className="fa fa-spinner fa-spin"/> : <i className="fa fa-user-plus"/>}Registrar estudiante
                </button>
            </div>
        </form>
    );
};
