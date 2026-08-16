import {useEffect, useMemo, useRef, useState} from "react";
import clsx from "clsx";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";

import {Input} from "../../../components/io/Input.tsx";
import {SelectInput} from "../../../components/io/SelectInput.tsx";
import {DatePicker} from "../../../components/io/DatePicker.tsx";
import {Student, StudentFormValues} from "../../../domain/student/Student.ts";
import {StudentSchema} from "../../../schemas/StudentSchema.ts";
import {StudentService} from "../../../services/student/StudentService.ts";
import {Gender, Genders} from "../../../domain/model/user/user.ts";
import {Pagination} from "../../../domain/filters/Page.ts";

type Mode = "SEARCH" | "CREATE";

interface Props {
    selected: Student | null;
    onSelect: (student: Student) => void;
    locked?: boolean;
    onUnlock?: () => void;
}

const studentService = StudentService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const fullName = (student: Student) => `${student.firstname ?? ""} ${student.lastname ?? ""}`.trim();

export const StudentStep = ({selected, onSelect, locked = false, onUnlock}: Props) => {
    const [mode, setMode] = useState<Mode>("SEARCH");
    const [term, setTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [items, setItems] = useState<Student[]>([]);
    const [pageNumber, setPageNumber] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const pageSize = 4;
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: {errors, isSubmitting},
        reset,
    } = useForm<StudentFormValues>({
        resolver: yupResolver(StudentSchema),
        reValidateMode: "onChange",
        defaultValues: {firstname: "", lastname: "", gender: Gender.MALE, birthDate: ""},
    });
    const birthDate = watch("birthDate");

    useEffect(() => {
        if (mode === "CREATE") {
            return;
        }
        setItems([]);
        setPageNumber(0);
        setHasMore(false);
    }, [mode]);

    const hasSelected = Boolean(selected?.id);

    const selectedBadge = useMemo(() => {
        if (!selected) return null;
        return (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500"/>
                {fullName(selected)}
            </span>
        );
    }, [selected]);

    const computeHasMore = (page: {page?: {number?: number; totalPages?: number}}) => {
        const current = page.page?.number ?? 0;
        const total = page.page?.totalPages ?? 1;
        return current + 1 < total;
    };

    const handleSearch = async () => {
        const normalized = term.trim();
        if (!normalized) {
            toast.error("Escribe matricula o nombre para buscar.");
            return;
        }
        setIsSearching(true);
        try {
            const page = await studentService.search(normalized, {...Pagination.first, size: pageSize});
            setItems(page.content ?? []);
            setPageNumber(page.page?.number ?? 0);
            setHasMore(computeHasMore(page));
            if ((page.content ?? []).length === 0) {
                toast.info("No se encontro estudiante. Puedes crearlo.");
            }
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "Error buscando estudiante.");
        } finally {
            setIsSearching(false);
        }
    };

    const loadMore = async () => {
        const normalized = term.trim();
        if (!normalized || isSearching || isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = pageNumber + 1;
            const page = await studentService.search(normalized, {page: nextPage, size: pageSize});
            const nextItems = page.content ?? [];
            setItems((prev) => {
                const seen = new Set(prev.map((student) => student.id));
                const merged = [...prev];
                nextItems.forEach((student) => {
                    if (!seen.has(student.id)) merged.push(student);
                });
                return merged;
            });
            setPageNumber(page.page?.number ?? nextPage);
            setHasMore(computeHasMore(page));
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "Error cargando mas estudiantes.");
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        const root = scrollRef.current;
        const sentinel = sentinelRef.current;
        if (!root || !sentinel) return;
        if (locked) return;
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                void loadMore();
            },
            {root, rootMargin: "180px 0px", threshold: 0}
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, locked, isLoadingMore, isSearching, pageNumber, term]);

    const handleCreate = async (values: StudentFormValues) => {
        try {
            const created = await studentService.create<StudentFormValues>("", values);
            toast.success("Estudiante creado.");
            onSelect(created);
            reset();
            setMode("SEARCH");
            const createdDocument = String((created as Partial<Student>).document ?? "").trim();
            setTerm(createdDocument || fullName(created));
            setItems([created]);
            setPageNumber(0);
            setHasMore(false);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "Error creando el estudiante.");
        }
    };

    return (
        <div className="space-y-4">
            <section className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white dark:bg-white/10">
                            Paso 1
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300"/>
                            Estudiante
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Busca el estudiante</h3>
                        <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            Por matricula o nombre. Si no existe, puedes registrarlo aqui mismo.
                        </p>
                        {!locked && selectedBadge}
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/5">
                        <button
                            type="button"
                            onClick={() => setMode("SEARCH")}
                            disabled={locked}
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
                            disabled={locked}
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

                {locked && selected && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                                {fullName(selected) || "Estudiante"}
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-emerald-800/80 dark:text-emerald-200/80">
                                {selected.document ? `Matricula/Doc: ${selected.document}` : "Matricula/Doc: —"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onUnlock}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-white/5 dark:text-emerald-200 dark:hover:bg-white/10"
                        >
                            Cambiar
                        </button>
                    </div>
                )}

                {mode === "SEARCH" && !locked && (
                    <form
                        className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleSearch();
                        }}
                    >
                        <Input
                            label="Matricula / nombre"
                            error={undefined}
                            value={term}
                            onChange={(event) => setTerm(event.target.value)}
                            placeholder="Ej: 2024-0012 o Juan Perez"
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !term.trim()}
                            className={clsx(
                                "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold transition",
                                isSearching || !term.trim()
                                    ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                                    : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                            )}
                        >
                            {isSearching ? "Buscando..." : "Buscar"}
                        </button>
                    </form>
                )}

                {mode === "SEARCH" && !locked && items.length > 0 && (
                    <div
                        ref={scrollRef}
                        className="mt-4 max-h-[260px] overflow-y-scroll overscroll-contain rounded-2xl border border-slate-200 bg-white/40 p-3 pr-2 touch-pan-y dark:border-white/10 dark:bg-white/5"
                        onScroll={(event) => {
                            const element = event.currentTarget;
                            const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
                            if (distanceToBottom < 160) {
                                void loadMore();
                            }
                        }}
                    >
                        <div className="grid gap-3 md:grid-cols-2">
                        {items.map((student) => {
                            const isSelected = selected?.id === student.id;
                            return (
                                <button
                                    key={student.id}
                                    type="button"
                                    onClick={() => onSelect(student)}
                                    className={clsx(
                                        "w-full rounded-[22px] border p-4 text-left transition",
                                        isSelected
                                            ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-400/40 dark:bg-emerald-500/10"
                                            : "border-slate-200 bg-white/80 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={clsx("truncate text-sm font-extrabold", isSelected ? "text-emerald-900 dark:text-emerald-200" : "text-slate-950 dark:text-white")}>
                                                {fullName(student) || "Estudiante"}
                                            </p>
                                            <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-300">
                                                {student.document ? `Matricula/Doc: ${student.document}` : "Matricula/Doc: —"}
                                            </p>
                                        </div>
                                        <span
                                            className={clsx(
                                                "inline-flex h-7 items-center rounded-full px-2 text-[11px] font-semibold",
                                                isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-200"
                                            )}
                                        >
                                            {isSelected ? "Seleccionado" : "Elegir"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        </div>

                        <div ref={sentinelRef} className="h-1 w-full"/>

                        <div className="pt-3 text-center">
                            {isLoadingMore && (
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Cargando mas...</span>
                            )}
                            {!isLoadingMore && hasMore && (
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Desliza para ver mas</span>
                            )}
                        </div>
                    </div>
                )}

                {mode === "CREATE" && (
                    <form onSubmit={handleSubmit(handleCreate)} className="mt-5 grid gap-3 md:grid-cols-2">
                        <Input label="Nombre(s)*" {...register("firstname")} error={errors.firstname?.message}/>
                        <Input label="Apellido(s)*" {...register("lastname")} error={errors.lastname?.message}/>
                        <SelectInput label="Genero*" {...register("gender")} error={errors.gender?.message}>
                            <option value="">Selecciona</option>
                            {Object.values(Gender).map((value) => (
                                <option key={value} value={value}>
                                    {Genders[value as keyof typeof Gender]}
                                </option>
                            ))}
                        </SelectInput>
                        <div>
                            <DatePicker
                                label="Fecha de nacimiento*"
                                value={birthDate ?? ""}
                                icon="fa-calendar-days"
                                required
                                onChange={(value) => setValue("birthDate", value, {shouldDirty: true, shouldValidate: true})}
                            />
                            {errors.birthDate?.message && <p className="mt-1 text-xs font-semibold text-red-500">{errors.birthDate.message}</p>}
                        </div>

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
                                    isSubmitting ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                                )}
                            >
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                )}

                {mode === "SEARCH" && !hasSelected && (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center dark:border-white/10 dark:bg-white/5">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">Ningun estudiante seleccionado.</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Selecciona uno para cargar sus representantes.</p>
                    </div>
                )}
            </section>
        </div>
    );
};
