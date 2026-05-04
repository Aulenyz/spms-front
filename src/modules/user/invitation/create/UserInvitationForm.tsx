import {useEffect, useMemo, useState} from "react";
import {toast} from "react-toastify";

import {UserInvitationFormValues, UserRole} from "../../../../domain/model/user/user.ts";
import {Pagination} from "../../../../domain/filters/Page.ts";
import {SelectOption} from "../../../../components/io/output/Select.tsx";
import {SearchSelect} from "../../../../components/io/input/SearchSelect.tsx";
import {RoleService} from "../../../../services/user/RoleService.ts";
import {UserInvitationService} from "../../../../services/user/UserInvitationService.ts";

const roleService = RoleService.instance;
const userInvitationService = UserInvitationService.instance;

export const UserInvitationForm = ({onSubmit}: { onSubmit?: () => void }) => {
    const [submitting, setSubmitting] = useState(false);
    const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
    const [errors, setErrors] = useState<Partial<Record<keyof UserInvitationFormValues, string>>>({});
    const [values, setValues] = useState<UserInvitationFormValues>({
        email: "",
        roleId: 0,
    });

    const canSubmit = useMemo(() => {
        const email = values.email.trim();
        return Boolean(email) && /\S+@\S+\.\S+/.test(email) && Number(values.roleId) > 0;
    }, [values]);

    const loadRoles = (term: string = "") => {
        roleService.search({term}, Pagination.ofSize(20)).then((page) => {
            setRoleOptions(
                page.content.map((role: UserRole) => ({
                    value: role.id,
                    description: role.name,
                }))
            );
        }, () => toast.error("Problemas cargando los roles."));
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const setField = (key: keyof UserInvitationFormValues, value: string | number) => {
        setValues((prev) => ({...prev, [key]: value}));
        setErrors((prev) => ({...prev, [key]: undefined}));
    };

    const validateLocal = () => {
        const nextErrors: Partial<Record<keyof UserInvitationFormValues, string>> = {};
        const email = values.email.trim();
        if (!email) nextErrors.email = "El correo es obligatorio.";
        else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Introduce un correo valido.";
        if (!values.roleId || Number(values.roleId) <= 0) nextErrors.roleId = "Selecciona un rol.";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const submit = async () => {
        if (submitting) return;
        if (!validateLocal()) return;

        setSubmitting(true);
        try {
            const payload: UserInvitationFormValues = {
                email: values.email.trim(),
                roleId: Number(values.roleId),
            };

            if (await userInvitationService.existsByEmail(payload.email)) {
                setErrors((prev) => ({...prev, email: "Este correo ya fue invitado."}));
                return;
            }

            await userInvitationService.create("/send", payload);
            toast.success("Invitacion enviada con exito.");
            onSubmit?.();
        } catch {
            toast.error("Error enviando la invitacion.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            className="relative flex h-full flex-col gap-4 px-5 pb-24 pt-4"
            onSubmit={(event) => {
                event.preventDefault();
                void submit();
            }}
        >
            <div className="rounded-[22px] border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-soft)"}}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{color: "var(--text-tertiary)"}}>
                    Datos principales
                </div>
                <div className="mt-1 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Envia una invitacion con el rol que tendra disponible el usuario al aceptar.
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Correo*
                </label>
                <label className="input input-sm w-full">
                    <i className="fa fa-envelope me-1"/>
                    <input
                        placeholder="correo@ejemplo.com"
                        value={values.email}
                        onChange={(event) => setField("email", event.target.value)}
                    />
                </label>
                {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                    Rol*
                </label>
                <SearchSelect
                    text="Buscar rol"
                    hasError={Boolean(errors.roleId)}
                    value={values.roleId || undefined}
                    options={roleOptions}
                    onSearch={loadRoles}
                    onSelect={(value) => setField("roleId", Number(value ?? 0))}
                    className="select-sm w-full"
                />
                {errors.roleId && <p className="mt-1 text-xs font-semibold text-red-500">{errors.roleId}</p>}
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="btn btn-sm"
                    onClick={onSubmit}
                    disabled={submitting}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="btn btn-sm btn-primary"
                    disabled={submitting || !canSubmit}
                >
                    {submitting ? "Enviando..." : "Enviar invitacion"}
                    <i className="fa fa-paper-plane ms-2"/>
                </button>
            </div>
        </form>
    );
};
