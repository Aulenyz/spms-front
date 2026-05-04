import {useEffect, useMemo, useState} from "react";
import {Link, useLocation, useParams} from "react-router-dom";
import clsx from "clsx";
import {toast} from "react-toastify";

import {Guardian} from "../../domain/student/Guardian.ts";
import {GuardianService} from "../../services/student/guardian/GuardianService.ts";

type TabKey = "students" | "contact" | "activity";

const TABS: Array<{key: TabKey; label: string; icon: string; hint: string}> = [
    {key: "students", label: "Estudiantes", icon: "fa-user-graduate", hint: "Relacionados"},
    {key: "contact", label: "Contacto", icon: "fa-address-card", hint: "Datos"},
    {key: "activity", label: "Actividad", icon: "fa-clock-rotate-left", hint: "Eventos"},
];

const guardianService = GuardianService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const getInitials = (value: string) =>
    value
        .split(" ")
        .map((word) => word.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

export const GuardianDetailsPage = () => {
    const {id} = useParams<{id: string}>();
    const location = useLocation();
    const stateGuardian = (location.state as {guardian?: Guardian} | null)?.guardian;

    const [loading, setLoading] = useState(false);
    const [guardian, setGuardian] = useState<Guardian | null>(stateGuardian ?? null);
    const [tab, setTab] = useState<TabKey>("students");

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        guardianService
            .getOne(id)
            .then((res) => setGuardian(res ?? null))
            .catch((error) => {
                toast.error(getApiErrorMessage(error) ?? "No se pudo cargar el detalle del representante.");
                setGuardian(null);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const name = useMemo(() => {
        const first = (guardian?.firstname ?? "").toString().trim();
        const last = (guardian?.lastname ?? "").toString().trim();
        return `${first} ${last}`.trim() || "Representante";
    }, [guardian?.firstname, guardian?.lastname]);

    const initials = useMemo(() => getInitials(name), [name]);

    const renderBody = () => {
        if (loading) {
            return <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>Cargando...</div>;
        }

        if (!guardian) {
            return <div className="p-6 text-sm font-semibold" style={{color: "var(--text-secondary)"}}>No se encontro el representante.</div>;
        }

        if (tab === "contact") {
            return (
                <div className="grid gap-4 p-5 lg:grid-cols-2">
                    <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                            Datos principales
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Documento
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {guardian.document ?? "-"}
                                </div>
                            </div>
                            <div className="rounded-2xl border px-4 py-3" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Telefono
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {guardian.phone ?? "-"}
                                </div>
                            </div>
                            <div className="rounded-2xl border px-4 py-3 sm:col-span-2" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                                    Correo
                                </div>
                                <div className="mt-1 truncate text-sm font-semibold" style={{color: "var(--text-primary)"}}>
                                    {guardian.email ?? "-"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{color: "var(--text-tertiary)"}}>
                            Direccion
                        </div>
                        <div className="rounded-2xl border p-4" style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <div className="text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                {guardian.address ?? "Sin direccion registrada."}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const rows = tab === "students"
            ? [
                {name: "Estudiante demo", note: "Pendiente endpoint"},
                {name: "Otro estudiante demo", note: "Pendiente endpoint"},
            ]
            : [
                {name: "Registro demo", note: "Pendiente endpoint"},
            ];

        return (
            <table className="table-shell">
                <thead>
                <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Nota</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((row) => (
                    <tr key={row.name}>
                        <td><strong>{row.name}</strong></td>
                        <td>{row.note}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="space-y-5">
            <div
                className="px-4 pb-4 pt-8 sm:px-6 sm:pb-5"
                style={{
                    background:
                        "radial-gradient(circle at top, rgba(15, 98, 254, 0.08), transparent 55%)," +
                        "radial-gradient(circle at top right, rgba(18, 128, 92, 0.06), transparent 45%)," +
                        "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))",
                }}
            >
                <div className="mx-auto flex w-full max-w-[1480px] flex-col items-center text-center">
                    <div
                        className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border text-lg font-extrabold"
                        style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)", color: "var(--text-primary)"}}
                    >
                        {initials}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-tight" style={{color: "var(--text-primary)"}}>
                            {name}
                        </h1>
                        <Link
                            to="/guardians/list"
                            className="inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold"
                            style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}
                        >
                            Padres / Tutores
                        </Link>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                            Documento: <span style={{color: "var(--text-primary)"}}>{guardian?.document ?? "-"}</span>
                        </div>
                        <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                            Telefono: <span style={{color: "var(--text-primary)"}}>{guardian?.phone ?? "-"}</span>
                        </div>
                        {guardian?.email && (
                            <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{borderColor: "var(--border-soft)", background: "var(--surface)", color: "var(--text-secondary)"}}>
                                {guardian.email}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1480px] px-2 sm:px-4">
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
                    style={{
                        borderColor: "var(--border-soft)",
                        background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                        boxShadow: "var(--shadow-soft)",
                    }}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        {TABS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setTab(item.key)}
                                className={clsx(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition",
                                    item.key === tab ? "shadow-sm" : "opacity-80 hover:opacity-100"
                                )}
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: item.key === tab ? "var(--surface)" : "transparent",
                                    color: item.key === tab ? "var(--text-primary)" : "var(--text-secondary)",
                                }}
                            >
                                <i className={`fa ${item.icon}`}/>
                                <span>{item.label}</span>
                                <span className="text-xs" style={{color: "var(--text-tertiary)"}}>
                                    {item.hint}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[26px] border" style={{borderColor: "var(--border-soft)", background: "var(--surface)", boxShadow: "var(--shadow-card)"}}>
                    {renderBody()}
                </div>
            </div>
        </div>
    );
};

