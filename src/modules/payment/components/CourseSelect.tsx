import {KeyboardEvent, useEffect, useMemo, useRef, useState} from "react";
import clsx from "clsx";
import {toast} from "react-toastify";

import {Course} from "../../../domain/model/course/Course.ts";
import {CourseService} from "../../../services/course/CourseService.ts";

interface Props {
    value: Course | null;
    onChange: (course: Course | null) => void;
}

const courseService = CourseService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const courseLabel = (course: Course) => {
    const division = (course.division ?? "").toString().trim();
    const specialization = (course.specialization?.name ?? "").toString().trim();
    if (specialization && division) return `${specialization} - ${division}`;
    return specialization || division || "Curso";
};

export const CourseSelect = ({value, onChange}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [items, setItems] = useState<Course[]>([]);
    const [pageNumber, setPageNumber] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const pageSize = 4;

    const displayValue = useMemo(() => {
        if (open) return term;
        return value ? courseLabel(value) : "";
    }, [open, term, value]);

    const loadPage = async (nextPage: number, nextTerm: string, append: boolean) => {
        append ? setIsLoadingMore(true) : setLoading(true);
        try {
            const page = await courseService.search(nextTerm, {page: nextPage, size: pageSize});
            const content = page.content ?? [];
            setItems((prev) => {
                if (!append) return content;
                const seen = new Set(prev.map((course) => course.id));
                const merged = [...prev];
                content.forEach((course) => {
                    if (!seen.has(course.id)) merged.push(course);
                });
                return merged;
            });
            const current = page.page?.number ?? nextPage;
            const total = page.page?.totalPages ?? 1;
            setPageNumber(current);
            setHasMore(current + 1 < total);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "Error cargando cursos.");
        } finally {
            append ? setIsLoadingMore(false) : setLoading(false);
        }
    };

    const openAndLoad = async () => {
        setOpen(true);
        await loadPage(0, term, false);
    };

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (containerRef.current.contains(event.target as Node)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handle = window.setTimeout(() => {
            void loadPage(0, term, false);
        }, 250);
        return () => window.clearTimeout(handle);
    }, [term, open]);

    useEffect(() => {
        const root = scrollRef.current;
        const sentinel = sentinelRef.current;
        if (!open || !root || !sentinel) return;
        if (!hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                if (loading || isLoadingMore) return;
                void loadPage(pageNumber + 1, term, true);
            },
            {root, rootMargin: "180px 0px", threshold: 0}
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [open, hasMore, loading, isLoadingMore, pageNumber, term]);

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
        }
        if (event.key === "Enter" && open) {
            event.preventDefault();
            if (items.length > 0) {
                onChange(items[0]);
                toast.success("Curso seleccionado.");
                setOpen(false);
            }
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-100">
                Curso*
            </label>

            <div className="relative">
                <input
                    value={displayValue}
                    onChange={(event) => {
                        setTerm(event.target.value);
                        if (!open) setOpen(true);
                    }}
                    onFocus={() => {
                        void openAndLoad();
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="Escribe para buscar curso..."
                    className={clsx(
                        "w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition",
                        "border-slate-200 bg-white/80 text-slate-900 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100",
                        "dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/10"
                    )}
                />

                <button
                    type="button"
                    aria-label="Limpiar curso"
                    onClick={() => onChange(null)}
                    className={clsx(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-xs font-bold transition",
                        value
                            ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            : "hidden"
                    )}
                >
                    <i className="fa fa-times"/>
                </button>
            </div>

            {open && (
                <div
                    ref={scrollRef}
                    className="mt-3 max-h-[260px] overflow-y-scroll overscroll-contain rounded-2xl border border-slate-200 bg-white/40 p-3 pr-2 touch-pan-y dark:border-white/10 dark:bg-white/5"
                    onScroll={(event) => {
                        const element = event.currentTarget;
                        const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
                        if (distanceToBottom < 160 && hasMore && !isLoadingMore && !loading) {
                            void loadPage(pageNumber + 1, term, true);
                        }
                    }}
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        {items.map((course) => {
                            const selected = value?.id === course.id;
                            return (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(course);
                                        toast.success("Curso seleccionado.");
                                        setOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full rounded-[22px] border p-4 text-left transition",
                                        selected
                                            ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-400/40 dark:bg-emerald-500/10"
                                            : "border-slate-200 bg-white/80 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className={clsx("truncate text-sm font-extrabold", selected ? "text-emerald-900 dark:text-emerald-200" : "text-slate-950 dark:text-white")}>
                                                {courseLabel(course)}
                                            </p>
                                            {course.specialization?.type && (
                                                <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-300">
                                                    {String(course.specialization.type)}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={clsx(
                                                "inline-flex h-7 items-center rounded-full px-2 text-[11px] font-semibold",
                                                selected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-200"
                                            )}
                                        >
                                            {selected ? "Seleccionado" : "Elegir"}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div ref={sentinelRef} className="h-1 w-full"/>

                    {items.length === 0 && !loading && (
                        <div className="pt-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-300">
                            No hay cursos para mostrar.
                        </div>
                    )}

                    <div className="pt-3 text-center">
                        {(loading || isLoadingMore) && (
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Cargando...</span>
                        )}
                        {!loading && !isLoadingMore && hasMore && (
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">Desliza para ver mas</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
