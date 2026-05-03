import {useEffect, useState} from "react";
import {RoleService} from "../../../services/user/RoleService.ts";
import {UserRole} from "../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {KeyValueOf, State} from "../../../domain/types/steoreotype.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {RoleFilter} from "../../../domain/filters/user/RoleFilter.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {RoleForm} from "./create/RoleForm.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {RoleBreadcrumb} from "../../breadcrumb/RoleBreadcrumb.tsx";
import {Link} from "react-router-dom";

const roleService: RoleService = RoleService.instance;

export const RoleListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [roles, setRoles]: State<Page<UserRole>> = useState(Pagination.empty<UserRole>());
    const [showModal, setShowModal]: State<boolean> = useState(false);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });

    useEffect(() => {
        roleService.getAll(filters, pagination).then(setRoles);
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
        <div className="space-y-6">
            <RoleBreadcrumb onCreate={() => setShowModal(true)}/>

            <DataTableCard
                title="Roles"
                description="Administra perfiles, descripcion y cantidad de permisos asignados."
                status={<span className="page-header-eyebrow">Registros: {roles.content.length}</span>}
                filters={<RoleFilter onFilter={handleUpdateFilter}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={roles}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Nombre</th>
                        <th scope="col">Descripcion</th>
                        <th scope="col">Permisos</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {roles.content.length === 0 && (
                        <tr>
                            <td colSpan={4}>
                                <EmptyState
                                    title="No hay roles registrados"
                                    description="Agrega un rol nuevo o cambia los filtros para continuar."
                                    icon="fa-user-shield"
                                />
                            </td>
                        </tr>
                    )}

                    {roles.content.map((role: UserRole, index: number) => (
                        <tr key={index}>
                            <td><strong>{role.name}</strong></td>
                            <td>{role.description}</td>
                            <td>{role.countAuthorities}</td>
                            <td className="text-right">
                                <Link
                                    to={`/users/roles/${role.id}`}
                                    state={{role}}
                                    className="table-link whitespace-nowrap"
                                >
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs"/>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>

            <LeftModal
                title="Agregar rol"
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <RoleForm onSubmit={() => setShowModal(false)}/>
            </LeftModal>
        </div>
    );
};
