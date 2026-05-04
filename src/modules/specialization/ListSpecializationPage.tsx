import {useEffect, useState} from "react";
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

export const ListSpecializationPage = () => {
    const {hasAuthority} = useAuthContext();
    const [pagination, setPagination] = useState(Pagination.ofSize(8));
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({
        name: "",
        type: "",
    });
    const [specializations, setSpecializations] = useState<Page<Specialization>>(Pagination.empty<Specialization>());

    useEffect(() => {
        specializationService.getAll(filters, pagination).then(setSpecializations);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleFilters = (nextFilters: Record<string, any>) => {
        setFilters(nextFilters);
        setPagination((prev) => ({...prev, page: 0}));
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Areas especializadas"
                description="Administra las areas especializadas disponibles."
            />

            <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
                style={{
                    borderColor: "var(--border-soft)",
                    background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                    boxShadow: "var(--shadow-soft)",
                }}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                        Mostrando {specializations.content.length} areas en esta pagina
                    </span>
                </div>

                {hasAuthority(AuthorityKey.SPECIALIZATION_CREATE) && (
                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => setShowModal(true)}
                        >
                            <i className="fa fa-plus me-1"/>
                            <span>Nueva area</span>
                        </button>
                    </div>
                )}
            </div>

            <DataTableCard
                title="Areas especializadas"
                description="Consulta las areas academica disponible."
                actions={
                    <>
                        {hasAuthority(AuthorityKey.SPECIALIZATION_CREATE) && (
                            <LeftModal
                                title="Agregar area"
                                isOpen={showModal}
                                onClose={() => setShowModal(false)}
                                className="w-[400px] h-full z-[9999]"
                            >
                                <SpecializationForm onSubmit={() => setShowModal(false)}/>
                            </LeftModal>
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
