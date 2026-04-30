import {useMemo, useState} from "react";
import clsx from "clsx";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";

import {Input} from "../../../components/io/Input.tsx";
import {Guardian, GuardianFormValues} from "../../../domain/student/Guardian.ts";
import {GuardianSchema} from "../../../schemas/GuardianSchema.ts";
import {GuardianService} from "../../../services/student/guardian/GuardianService.ts";

type Mode = "SEARCH" | "CREATE";

interface Props {
    selected: Guardian[];
    onChange: (next: Guardian[]) => void;
}

const guardianService = GuardianService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const getInitials = (guardian: Guardian) => {
    const first = (guardian.firstname ?? "").trim().charAt(0);
    const last = (guardian.lastname ?? "").trim().charAt(0);
    const initials = `${first}${last}`.toUpperCase();
    return initials || "RG";
};

export const GuardianStep = ({selected, onChange}: Props) => {
    const [mode, setMode] = useState<Mode>("SEARCH");
    const [document, setDocument] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<Guardian | null>(null);

    const alreadySelected = useMemo(() => {
        const normalized = (document ?? "").trim();
        if (!normalized) return false;
        return selected.some((guardian) => guardian.document === normalized);
    }, [document, selected]);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
        reset,
    } = useForm<GuardianFormValues>({
        resolver: yupResolver(GuardianSchema),
        reValidateMode: "onChange",
        defaultValues: {document: "", firstname: "", lastname: "", phone: "", email: "", address: ""},
    });

    const addGuardian = (guardian: Guardian) => {
        if (selected.some((item) => item.document === guardian.document)) {
            toast.info("Ese representante ya esta agregado.");
            return;
        }
        onChange([...selected, guardian]);
        toast.success("Representante agregado.");
    };

    const removeGuardian = (document: string) => {
        onChange(selected.filter((guardian) => guardian.document !== document));
    };

    const handleSearch = async () => {
        const normalized = (document ?? "").trim();
        if (!normalized) {
            toast.error("Digita el documento para buscar.");
            return;
        }
        setIsSearching(true);
        setSearchResult(null);
        try {
            const guardian = await guardianService.findByDocument(normalized);
            setSearchResult(guardian);
        } catch (error) {
            const message = getApiErrorMessage(error);
            toast.error(message ?? "No se encontro representante con ese documento. Puedes registrarlo.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreate = async (values: GuardianFormValues) => {
        try {
            const created = await guardianService.create<GuardianFormValues>("", values);
            addGuardian(created);
            reset();
            setMode("SEARCH");
            setDocument(values.document);
            setSearchResult(created);
        } catch (error) {
            const message = getApiErrorMessage(error);
            toast.error(message ?? "Error registrando el representante.");
        }
    };

    return (
        <div className="space-y-4">
            <section
                className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white dark:bg-white/10">
                            Paso 2
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300"/>
                            Representantes
                        </div>
                        <h3 className="text-x font-black tracking-tight text-slate-950 dark:text-white">Selecciona los
                            padres</h3>
                    </div>

                    <div
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setMode("SEARCH")}
                            className={clsx(
                                "h-10 rounded-xl px-4 text-sm font-semibold transition",
                                mode === "SEARCH"
                                    ? "bg-slate-900 text-white shadow-sm dark:bg-white/10"
                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                            )}
                        >
                            Buscar
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("CREATE")}
                            className={clsx(
                                "h-10 rounded-xl px-4 text-sm font-semibold transition",
                                mode === "CREATE"
                                    ? "bg-slate-900 text-white shadow-sm dark:bg-white/10"
                                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                            )}
                        >
                            Registrar
                        </button>
                    </div>
                </div>

                {mode === "SEARCH" && (
                    <form
                        className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSearch();
                        }}
                    >
                        <Input
                            label="Documento del representante"
                            error={undefined}
                            value={document}
                            onChange={(event) => setDocument(event.target.value)}
                            placeholder="Ej: 001-0000000-0"
                        />
                        <button
                            type="submit"
                            onClick={handleSearch}
                            disabled={isSearching || !document.trim()}
                            className={clsx(
                                "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold transition",
                                isSearching || !document.trim()
                                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                    : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                            )}
                        >
                            {isSearching ? "Buscando..." : "Buscar"}
                        </button>
                    </form>
                )}

                {mode === "SEARCH" && searchResult && (
                    <div
                        className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white dark:bg-white/10">
                                    {getInitials(searchResult)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-950 dark:text-white">
                                        {searchResult.firstname} {searchResult.lastname}
                                    </p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                                        Doc: {searchResult.document}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {searchResult.phone ? `Tel: ${searchResult.phone}` : "Sin telefono"}{" "}
                                        {searchResult.email ? `- ${searchResult.email}` : ""}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => addGuardian(searchResult)}
                                disabled={alreadySelected}
                                className={clsx(
                                    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold transition",
                                    alreadySelected
                                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15"
                                )}
                            >
                                {alreadySelected ? "Ya agregado" : "Agregar"}
                            </button>
                        </div>
                    </div>
                )}

                {mode === "CREATE" && (
                    <form onSubmit={handleSubmit(handleCreate)} className="mt-5 grid gap-3 md:grid-cols-2">
                        <Input label="Documento*" {...register("document")} error={errors.document?.message}/>
                        <Input label="Telefono*" {...register("phone")} error={errors.phone?.message}/>
                        <Input label="Nombre(s)*" {...register("firstname")} error={errors.firstname?.message}/>
                        <Input label="Apellido(s)*" {...register("lastname")} error={errors.lastname?.message}/>
                        <Input label="Email" {...register("email")} error={errors.email?.message}/>
                        <Input label="Direccion" {...register("address")} error={errors.address?.message}/>

                        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setMode("SEARCH");
                                }}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={clsx(
                                    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold transition",
                                    isSubmitting ? "cursor-not-allowed bg-slate-200 text-slate-500" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                )}
                            >
                                {isSubmitting ? "Guardando..." : "Guardar y agregar"}
                            </button>
                        </div>
                    </form>
                )}
            </section>

            <section
                className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h4 className="text-base font-bold text-slate-950 dark:text-white">Representantes agregados</h4>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {selected.length} agregado{selected.length === 1 ? "" : "s"}
                    </span>
                </div>

                {selected.length === 0 ? (
                    <div
                        className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Aun no hay
                            representantes.</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Busca por documento o registra
                            uno nuevo.</p>
                    </div>
                ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {selected.map((guardian) => (
                            <article
                                key={guardian.document}
                                className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f1f5f9_55%,#eef2ff_100%)] p-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_60%,rgba(34,211,238,0.06)_100%)]"
                            >
                                <div
                                    className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl transition group-hover:bg-cyan-200/60 dark:bg-cyan-500/10"/>
                                <div className="relative flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white shadow-sm dark:bg-white/10">
                                            {getInitials(guardian)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-extrabold text-slate-950 dark:text-white">
                                                {guardian.firstname} {guardian.lastname}
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                                                {guardian.document}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Quitar representante"
                                        onClick={() => removeGuardian(guardian.document)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 transition hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                                    >
                                        <i className="fa fa-times"/>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

            </section>
        </div>
    );
};
