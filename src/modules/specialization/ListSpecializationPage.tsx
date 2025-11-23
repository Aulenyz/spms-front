import {useEffect, useState} from "react";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Specialization} from "../../domain/model/course/Course.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {SpecializationService} from "../../services/specialization/SpecializationService.ts";
import {SpecializationCard} from "./SpecializationCard.tsx";
import {SpecializationFilter} from "../../domain/filters/specification/SpecializationFilter.tsx";

const specializationService = SpecializationService.instance;

export const ListSpecializationPage = () => {

    const [pagination, setPagination] = useState({...Pagination.first, size: 8});

    const [filters, setFilters] = useState<Record<string, any>>({
        name: "",
        type: "",
    });

    const [specializations, setSpecializations] =
        useState<Page<Specialization>>(Pagination.empty<Specialization>());

    const load = () => {
        specializationService.getAll(filters, pagination).then(setSpecializations);
    };

    useEffect(load, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination(prev => ({...prev, page}));
    };

    const handleFilters = (f: Record<string, any>) => {
        setFilters(f);
        setPagination(prev => ({...prev, page: 0}));
    };

    return (
        <div className="pt-6 pl-9 pr-5">

            {/* Título principal */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-800">
                    Unidades Académicas
                </h1>
            </div>

            <div className="card border border-gray-200 rounded-md shadow-sm">

                <div
                    className="card-header flex justify-between items-end flex-wrap gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h1 className="text-gray-500 text-sm">
                        Catálogo de Unidades Académicas disponibles.
                    </h1>

                    <div className="flex justify-end">
                        <SpecializationFilter onFilter={handleFilters}/>
                    </div>
                </div>


                <div className="px-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {specializations.content.map((spec) => (
                            <SpecializationCard key={spec.id} specialization={spec}/>
                        ))}
                    </div>
                </div>

                {/* Footer: paginación */}
                <Pager onChange={handlePageChange} page={specializations}/>
            </div>

        </div>
    );
};
