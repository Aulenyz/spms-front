import {useEffect, useState} from "react";
import {UserAuthority} from "../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {KeyValueOf, State} from "../../../domain/types/steoreotype.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {RoleFilter} from "../../../domain/filters/user/RoleFilter.tsx";
import {AuthorityService} from "../../../services/user/AuthorityService.ts";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {AuthorityForm} from "./create/AuthorityForm.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";

const authorityService: AuthorityService = AuthorityService.instance;

export const AuthorityListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [authorities, setAuthorities]: State<Page<UserAuthority>> = useState(Pagination.empty<UserAuthority>());
    const [showModal, setShowModal]: State<boolean> = useState(false);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({});

    useEffect(() => {
        authorityService.getAll(filters, pagination).then(setAuthorities);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleUpdateFilter = (nextFilters: KeyValueOf<string>) => {
        setFilters({...nextFilters});
        handlePageChange(0);
    };

    return (
        <DataTableCard
            title="Permisos"
            description="Gestiona las llaves de acceso disponibles para reglas y acciones del sistema."
            status={<span className="page-header-eyebrow">Registros: {authorities.content.length}</span>}
            actions={
                <>
                    <button onClick={() => setShowModal(true)} className="btn btn-sm btn-primary">
                        <i className="fa fa-plus me-1"/>
                        <span>Agregar</span>
                    </button>
                    <LeftModal
                        title="Agregar permiso"
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        className="w-[400px] h-full z-[9999]"
                    >
                        <AuthorityForm onSubmit={() => setShowModal(false)}/>
                    </LeftModal>
                </>
            }
            filters={<RoleFilter onFilter={handleUpdateFilter}/>}
            footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={authorities}/>}
        >
            <table className="table-shell">
                <thead>
                <tr>
                    <th scope="col">Llave</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Descripcion</th>
                </tr>
                </thead>
                <tbody>
                {authorities.content.length === 0 && (
                    <tr>
                        <td colSpan={3}>
                            <EmptyState
                                title="No hay permisos registrados"
                                description="Agrega un nuevo permiso o cambia los filtros para continuar."
                                icon="fa-sliders"
                            />
                        </td>
                    </tr>
                )}
                {authorities.content.map((authority: UserAuthority, index: number) => (
                    <tr key={index}>
                        <td><strong>{authority.key}</strong></td>
                        <td>{authority.name}</td>
                        <td>{authority.description}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </DataTableCard>
    );
};
