import {useCallback, useState} from "react";
import {toast} from "react-toastify";
import {SPECIALIZATION_FILTER_DEFAULTS} from "../../domain/filters/specification/specializationFilterDefaults.ts";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../app/query/queryKeys.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Specialization} from "../../domain/model/course/Course.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {SpecializationService} from "../../services/specialization/SpecializationService.ts";
import {SpecializationCard} from "./SpecializationCard.tsx";
import {SpecializationFilter} from "../../domain/filters/specification/SpecializationFilter.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {SpecializationForm} from "./create/SpecializationForm.tsx";
import {SpecializationBreadcrumb} from "../breadcrumb/SpecializationBreadcrumb.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

const specializationService = SpecializationService.instance;
const EMPTY_PAGE: Page<Specialization> = Pagination.empty<Specialization>();

export const ListSpecializationPage = () => {
    const {hasAuthority} = useAuthContext();
    const [pagination, setPagination] = useState(Pagination.ofSize(8));
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Specialization | null>(null);
    const canEdit = hasAuthority(AuthorityKey.SPECIALIZATION_EDIT);
    const canChangeStatus = hasAuthority(AuthorityKey.SPECIALIZATION_STATUS_UPDATE);
    // Debe coincidir con SPECIALIZATION_FILTER_DEFAULTS: el filtro no emite su valor inicial.
    const [filters, setFilters] = useState<Record<string, any>>(SPECIALIZATION_FILTER_DEFAULTS);
    const queryClient = useQueryClient();
    const {data: specializations = EMPTY_PAGE} = useQuery({
        queryKey: queryKeys.specializations.list({filters, pagination}),
        queryFn: ({signal}) => specializationService.withSignal(signal).getAll(filters, pagination),
        placeholderData: keepPreviousData,
    });

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleFilters = useCallback((nextFilters: Record<string, any>) => {
        setFilters(nextFilters);
        setPagination((prev) => ({...prev, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Áreas especializadas"
                description="Administra las áreas especializadas disponibles."
            />

            <SpecializationBreadcrumb onCreate={() => setShowModal(true)}/>

            <DataTableCard
                title="Áreas especializadas"
                description="Consulta las áreas académica disponible."
                filters={<SpecializationFilter onFilter={handleFilters}/>}
                footer={
                    <Pager
                        onChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={[4, 8, 12]}
                        page={specializations}
                    />
                }
            >
                {specializations.content.length === 0 ? (
                    <EmptyState
                        title="No hay áreas especializadas"
                        description="Ajusta los filtros o agrega una nueva área."
                        icon="fa-book-open"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {[...specializations.content]
                            .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
                            .map((spec) => (
                                <SpecializationCard key={spec.id} specialization={spec}
                                                    onEdit={canEdit ? () => setEditing(spec) : undefined}
                                                    onToggleStatus={canChangeStatus ? () => specializationService.updateStatus(spec.id)
                                                        .then(() => {
                                                            toast.success("Estado actualizado satisfactoriamente.");
                                                            void queryClient.invalidateQueries({queryKey: queryKeys.specializations.all});
                                                        })
                                                        .catch((error) => toast.error((error as {message?: string})?.message ?? "No se pudo actualizar el estado."))
                                                        : undefined}/>
                            ))}
                    </div>
                )}
            </DataTableCard>

            <LeftModal
                title="Nueva área"
                isOpen={hasAuthority(AuthorityKey.SPECIALIZATION_CREATE) && showModal}
                onClose={() => setShowModal(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <SpecializationForm onCancel={() => setShowModal(false)} onSubmit={() => {
                    setShowModal(false);
                    void queryClient.invalidateQueries({queryKey: queryKeys.specializations.all});
                }}/>
            </LeftModal>

            <LeftModal
                title="Editar área"
                isOpen={canEdit && editing !== null}
                onClose={() => setEditing(null)}
                className="w-[400px] h-full z-[9999]"
            >
                {editing && (
                    <SpecializationForm key={editing.id} specialization={editing} onCancel={() => setEditing(null)} onSubmit={() => {
                        setEditing(null);
                        void queryClient.invalidateQueries({queryKey: queryKeys.specializations.all});
                    }}/>
                )}
            </LeftModal>
        </div>
    );
};
