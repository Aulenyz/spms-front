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

const specializationService = SpecializationService.instance;

export const ListSpecializationPage = () => {
    const [pagination, setPagination] = useState(Pagination.first);
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
                eyebrow="Academico"
                title="Unidades"
                description="Administra las unidades academicas base usadas por cursos y plantillas."
            />

            <DataTableCard
                title="Unidades academicas"
                description="Consulta y organiza la estructura academica disponible."
                actions={
                    <>
                        <button onClick={() => setShowModal(true)} className="btn btn-sm btn-primary">
                            <i className="fa fa-plus me-1"/>
                            <span>Agregar</span>
                        </button>
                        <LeftModal
                            title="Agregar unidad"
                            isOpen={showModal}
                            onClose={() => setShowModal(false)}
                            className="w-[400px] h-full z-[9999]"
                        >
                            <SpecializationForm onSubmit={() => setShowModal(false)}/>
                        </LeftModal>
                    </>
                }
                filters={<SpecializationFilter onFilter={handleFilters}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={specializations}/>}
            >
                {specializations.content.length === 0 ? (
                    <EmptyState
                        title="No hay unidades academicas"
                        description="Ajusta los filtros o agrega una nueva unidad."
                        icon="fa-book-open"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {specializations.content.map((spec) => (
                            <SpecializationCard key={spec.id} specialization={spec}/>
                        ))}
                    </div>
                )}
            </DataTableCard>
        </div>
    );
};
