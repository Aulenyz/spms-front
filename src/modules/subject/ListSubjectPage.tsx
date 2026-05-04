import {useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";

import {Page, Pagination} from "../../domain/filters/Page.ts";
import {State} from "../../domain/types/steoreotype.ts";
import {Subject} from "../../domain/model/course/Subject.ts";
import {SubjectService} from "../../services/course/SubjectService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {SubjectFilter} from "../../domain/filters/course/SubjectFilter.tsx";
import {SubjectBreadcrumb} from "../breadcrumb/SubjectBreadcrumb.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {SubjectForm} from "./SubjectForm.tsx";
import {CourseActivePill} from "../../components/io/output/pill/CourseActivePill.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

const subjectService = SubjectService.instance;

const getApiErrorMessage = (error: unknown) => {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (typeof error === "object") {
        const maybeMessage = (error as {message?: unknown}).message;
        if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
    }
    return null;
};

export const ListSubjectPage = () => {
    const {hasAuthority} = useAuthContext();
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.ofSize(6));
    const [subjects, setSubjects]: State<Page<Subject>> = useState(Pagination.empty<Subject>());
    const [refreshKey, setRefreshKey] = useState(0);
    const [filters, setFilters] = useState<Record<string, any>>({term: "", active: "true"});
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Subject | null>(null);
    const [menuId, setMenuId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const active = filters.active === "" ? undefined : filters.active === "true";
        subjectService.search({term: filters.term ?? "", active}, pagination).then(setSubjects);
    }, [pagination, filters, refreshKey]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (!menuRef.current) return;
            if (menuRef.current.contains(event.target as Node)) return;
            setMenuId(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handlePageChange = (page: number) => setPagination((prev) => ({...prev, page}));

    const handlePageSizeChange = (size: number) => setPagination((prev) => ({...prev, page: 0, size}));

    const handleFilters = (next: Record<string, any>) => {
        setFilters({...next});
        setPagination((prev) => ({...prev, page: 0}));
    };

    const refresh = () => setRefreshKey((prev) => prev + 1);

    const pagerPage: Page<Subject> = {
        ...subjects,
        page: {
            size: pagination.size,
            number: pagination.page,
            totalElements: subjects.page?.totalElements ?? subjects.content.length,
            totalPages: subjects.page?.totalPages
                ?? Math.max(1, Math.ceil((subjects.page?.totalElements ?? subjects.content.length) / pagination.size)),
        },
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Gestion academica"
                title="Materias"
                description="Consulta materias por nombre, codigo o descripcion y controla su estado."
            />

            <SubjectBreadcrumb onCreate={() => setShowCreate(true)}/>

            <DataTableCard
                title="Listado"
                description="Filtra y revisa las materias registradas en el espacio de trabajo."
                status={<span className="page-header-eyebrow">Registros: {subjects.content.length}</span>}
                filters={<SubjectFilter onFilter={handleFilters}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} pageSizeOptions={[3, 6, 9]} page={pagerPage}/>}
            >
                {subjects.content.length === 0 ? (
                    <EmptyState
                        title="No hay materias para mostrar"
                        description="Prueba otros filtros o crea una nueva materia."
                        icon="fa-book-open"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {subjects.content.map((subject) => (
                            <article
                                key={subject.id}
                                className="group relative flex min-h-[230px] flex-col justify-between overflow-visible rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-1"
                                style={{
                                    borderColor: "var(--border-soft)",
                                    background: "var(--surface)",
                                    boxShadow: "var(--shadow-card)",
                                }}
                            >
                                <div
                                    className="absolute left-0 top-0 h-full w-1.5 rounded-l-[24px]"
                                    style={{
                                        background: subject.active
                                            ? "linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 65%, white))"
                                            : "linear-gradient(180deg, color-mix(in srgb, var(--text-tertiary) 80%, white), var(--muted))",
                                    }}
                                />

                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                                                 style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                                                <i className="fa fa-hashtag text-[10px]"/>
                                                {subject.code ?? "-"}
                                            </div>
                                            <h3 className="mt-3 truncate text-base font-semibold" style={{color: "var(--text-primary)"}}>
                                                {subject.name ?? "-"}
                                            </h3>
                                        </div>

                                        <div className="relative flex-shrink-0" ref={menuId === subject.id ? menuRef : undefined}>
                                            {(hasAuthority(AuthorityKey.SUBJECT_EDIT) || hasAuthority(AuthorityKey.SUBJECT_STATUS_UPDATE)) && (
                                                <button
                                                    type="button"
                                                    className="icon-button h-9 w-9"
                                                    onClick={() => setMenuId((prev) => prev === subject.id ? null : subject.id)}
                                                    title="Opciones"
                                                >
                                                    <i className="fa fa-gear text-sm"/>
                                                </button>
                                            )}

                                            {menuId === subject.id && (hasAuthority(AuthorityKey.SUBJECT_EDIT) || hasAuthority(AuthorityKey.SUBJECT_STATUS_UPDATE)) && (
                                                <div className="floating-panel right-0 top-full mt-2 w-64">
                                                    <div className="floating-panel-header">Opciones</div>
                                                    <div className="space-y-1 p-2">
                                                        {hasAuthority(AuthorityKey.SUBJECT_EDIT) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMenuId(null);
                                                                    setEditing(subject);
                                                                }}
                                                                className="profile-menu-item w-full"
                                                            >
                                                                <i className="fa fa-pen text-[var(--accent)]"/>
                                                                <span>Editar materia</span>
                                                            </button>
                                                        )}
                                                        {hasAuthority(AuthorityKey.SUBJECT_STATUS_UPDATE) && (
                                                            <button
                                                                type="button"
                                                                disabled={togglingId === subject.id}
                                                                onClick={() => {
                                                                    setTogglingId(subject.id);
                                                                    subjectService
                                                                        .updateStatus(subject.id)
                                                                        .then(() => {
                                                                            toast.success("Estado actualizado.");
                                                                            setMenuId(null);
                                                                            refresh();
                                                                        })
                                                                        .catch((error) => toast.error(getApiErrorMessage(error) ?? "No se pudo actualizar el estado."))
                                                                        .finally(() => setTogglingId(null));
                                                                }}
                                                                className="profile-menu-item w-full"
                                                            >
                                                                <i className="fa fa-toggle-on text-[var(--accent)]"/>
                                                                <span>{subject.active ? "Marcar como inactiva" : "Marcar como activa"}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <CourseActivePill active={Boolean(subject.active)}/>
                                    </div>

                                    <p className="line-clamp-4 text-sm leading-6" style={{color: "var(--text-secondary)"}}>
                                        {subject.description ?? "Sin descripcion registrada."}
                                    </p>
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                                    <span className="text-xs font-semibold" style={{color: "var(--text-tertiary)"}}>
                                        Materia academica
                                    </span>
                                    {hasAuthority(AuthorityKey.SUBJECT_EDIT) && (
                                        <button
                                            type="button"
                                            className="table-link"
                                            onClick={() => setEditing(subject)}
                                        >
                                            Editar
                                            <i className="fa fa-chevron-right text-2xs"/>
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </DataTableCard>

            <LeftModal
                title="Nueva materia"
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                className="w-[420px] h-full z-[9999]"
            >
                <SubjectForm
                    onDone={() => setShowCreate(false)}
                    onSaved={refresh}
                />
            </LeftModal>

            <LeftModal
                title="Editar materia"
                isOpen={hasAuthority(AuthorityKey.SUBJECT_EDIT) && Boolean(editing)}
                onClose={() => setEditing(null)}
                className="w-[420px] h-full z-[9999]"
            >
                <SubjectForm
                    initial={editing}
                    onDone={() => setEditing(null)}
                    onSaved={refresh}
                />
            </LeftModal>
        </div>
    );
};
