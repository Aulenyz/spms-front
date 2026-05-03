import {KeyboardEvent, useEffect, useMemo, useRef, useState} from "react";
import clsx from "clsx";
import {toast} from "react-toastify";

import {Specialization} from "../../../domain/model/course/Course.ts";
import {SpecializationService} from "../../../services/specialization/SpecializationService.ts";

interface Props {
    value: Specialization | null;
    onChange: (specialization: Specialization | null) => void;
    label?: string;
    placeholder?: string;
}

const specializationService = SpecializationService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

const specializationLabel = (spec: Specialization) => (spec.name ?? "").toString().trim() || "Área especializada";

export const SpecializationSelect = ({
    value,
    onChange,
    label = "Área especializada (opcional)",
    placeholder = "Escribe para buscar área especializada...",
}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [items, setItems] = useState<Specialization[]>([]);
    const [pageNumber, setPageNumber] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const pageSize = 4;

    const displayValue = useMemo(() => {
        if (open) return term;
        return value ? specializationLabel(value) : "";
    }, [open, term, value]);

    const loadPage = async (nextPage: number, nextTerm: string, append: boolean) => {
        append ? setIsLoadingMore(true) : setLoading(true);
        try {
            const page = await specializationService.search(nextTerm, {page: nextPage, size: pageSize});
            const content = page.content ?? [];
            setItems((prev) => {
                if (!append) return content;
                const seen = new Set(prev.map((spec) => spec.id));
                const merged = [...prev];
                content.forEach((spec) => {
                    if (!seen.has(spec.id)) merged.push(spec);
                });
                return merged;
            });
            const current = page.page?.number ?? nextPage;
            const total = page.page?.totalPages ?? 1;
            setPageNumber(current);
            setHasMore(current + 1 < total);
        } catch (error) {
            toast.error(getApiErrorMessage(error) ?? "Error cargando áreas especializadas.");
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
                toast.success("Especializacion seleccionada.");
                setOpen(false);
            }
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                {label}
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
                    placeholder={placeholder}
                    className={clsx("input input-sm w-full")}
                />

                <button
                    type="button"
                    aria-label="Limpiar área especializada"
                    onClick={() => onChange(null)}
                    className={clsx("absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs", value ? "" : "hidden")}
                >
                    <i className="fa fa-times"/>
                </button>
            </div>

            {open && (
                <div
                    ref={scrollRef}
                    className="search-select-dropdown mt-1.5 max-h-[260px] overflow-y-auto overscroll-contain"
                    onScroll={(event) => {
                        const element = event.currentTarget;
                        const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
                        if (distanceToBottom < 160 && hasMore && !isLoadingMore && !loading) {
                            void loadPage(pageNumber + 1, term, true);
                        }
                    }}
                >
                    <div className="grid gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onChange(null);
                                setOpen(false);
                            }}
                            className={clsx(
                                "search-select-option flex items-center justify-between gap-3",
                                value === null ? "search-select-option-active" : ""
                            )}
                        >
                            <span className="truncate font-semibold">Sin área especializada</span>
                            <span className="text-xs opacity-70">Opcional</span>
                        </button>

                        {items.map((spec) => {
                            const selected = value?.id === spec.id;
                            return (
                                <button
                                    key={spec.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(spec);
                                        toast.success("Especializacion seleccionada.");
                                        setOpen(false);
                                    }}
                                    className={clsx(
                                        "search-select-option flex items-center justify-between gap-3",
                                        selected ? "search-select-option-active" : ""
                                    )}
                                >
                                    <span className="truncate font-semibold">{specializationLabel(spec)}</span>
                                    {spec.type && <span className="text-xs opacity-70">{String(spec.type)}</span>}
                                </button>
                            );
                        })}
                    </div>

                    <div ref={sentinelRef} className="h-1 w-full"/>

                    {items.length === 0 && !loading && (
                        <div className="py-3 text-center text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                            No hay áreas especializadas para mostrar.
                        </div>
                    )}

                    <div className="py-2 text-center">
                        {(loading || isLoadingMore) && (
                            <span className="text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                Cargando...
                            </span>
                        )}
                        {!loading && !isLoadingMore && hasMore && (
                            <span className="text-xs font-semibold" style={{color: "var(--text-secondary)"}}>
                                Desliza para ver mas
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
