import {useCallback, useState} from "react";
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
                title="Areas especializadas"
                description="Administra las areas especializadas disponibles."
            />

            <DataTableCard
                title="Areas especializadas"
                description="Consulta las areas academica disponible."
                actions={
                    <>
                        {hasAuthority(AuthorityKey.SPECIALIZATION_CREATE) && (
                            <>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setShowModal(true)}
                                >
                                    <i className="fa fa-plus me-1"/>
                                    <span>Nueva area</span>
                                </button>
                                <LeftModal
                                    title="Agregar area"
                                    isOpen={showModal}
                                    onClose={() => setShowModal(false)}
                                    className="w-[400px] h-full z-[9999]"
                                >
                                    <SpecializationForm onSubmit={() => {
                                        setShowModal(false);
                                        void queryClient.invalidateQueries({queryKey: queryKeys.specializations.all});
                                    }}/>
                                </LeftModal>
                            </>
                        )}
                    </>
                }
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
                        title="No hay areas especializadas"
                        description="Ajusta los filtros o agrega una nueva area."
                        icon="fa-book-open"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {[...specializations.content]
                            .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
                            .map((spec) => (
                                <SpecializationCard key={spec.id} specialization={spec}/>
                            ))}
                    </div>
                )}
            </DataTableCard>
        </div>
    );
};
