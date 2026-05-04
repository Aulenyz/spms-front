import {useEffect, useState} from "react";
import {Link} from "react-router-dom";

import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {Guardian} from "../../domain/student/Guardian.ts";
import {GuardianService} from "../../services/student/guardian/GuardianService.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {PageHeader} from "../../components/ui/layout/PageHeader.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {GuardianFilter} from "../../domain/filters/student/GuardianFilter.tsx";

const guardianService = GuardianService.instance;

export const ListGuardianPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [guardians, setGuardians]: State<Page<Guardian>> = useState(Pagination.empty<Guardian>());
    const [filters, setFilters] = useState<KeyValueOf<string>>({});

    useEffect(() => {
        guardianService.getAll(filters as any, pagination).then(setGuardians);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => setPagination((prev) => ({...prev, page}));

    const handlePageSizeChange = (size: number) => setPagination((prev) => ({...prev, page: 0, size}));

    const handleUpdateFilter = (incoming: KeyValueOf<string>) => {
        const next = {...incoming};
        if (!incoming.document) delete next.document;
        if (!incoming.firstname) delete next.firstname;
        if (!incoming.lastname) delete next.lastname;
        setFilters(next);
        handlePageChange(0);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Padres / Tutores"
                description="Consulta representantes registrados por documento, nombre o apellido desde una sola vista."
            />

            <DataTableCard
                title="Listado de padres / tutores"
                description="Filtra por documento, nombre o apellido para localizar rapidamente un representante."
                status={<span className="page-header-eyebrow">Registros: {guardians.content.length}</span>}
                filters={<GuardianFilter onFilter={handleUpdateFilter}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={guardians}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Documento</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Apellido</th>
                        <th scope="col">Teléfono</th>
                        <th scope="col">Correo</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {guardians.content.length === 0 && (
                        <tr>
                            <td colSpan={6}>
                                <EmptyState
                                    title="No hay padres / tutores para mostrar"
                                    description="Prueba otros filtros para ver mas resultados."
                                    icon="fa-people-roof"
                                />
                            </td>
                        </tr>
                    )}

                    {guardians.content.map((guardian, index) => (
                        <tr key={index}>
                            <td><strong>{guardian.document ?? "-"}</strong></td>
                            <td>{guardian.firstname ?? "-"}</td>
                            <td>{guardian.lastname ?? "-"}</td>
                            <td>{guardian.phone ?? "-"}</td>
                            <td className="truncate max-w-[240px]">{guardian.email ?? "-"}</td>
                            <td className="text-right">
                                <Link to={`/guardians/${guardian.id}`} state={{guardian}}
                                      className="table-link whitespace-nowrap">
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs"/>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>
        </div>
    );
};

