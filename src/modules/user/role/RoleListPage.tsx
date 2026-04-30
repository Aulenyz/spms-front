import {useEffect, useState} from "react";
import {RoleService} from "../../../services/user/RoleService.ts";
import {UserRole} from "../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {KeyValueOf, State} from "../../../domain/types/steoreotype.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {RoleFilter} from "../../../domain/filters/user/RoleFilter.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {RoleForm} from "./create/RoleForm.tsx";
import {Tooltip} from "../../../components/shared/Tooltip.tsx";
import {AuthoritiesModal} from "./AuthoritiesModal.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";

const roleService: RoleService = RoleService.instance;

export const RoleListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [roles, setRoles]: State<Page<UserRole>> = useState(Pagination.empty<UserRole>());
    const [showAuthorities, setShowAuthorities]: State<boolean> = useState(false);
    const [showModal, setShowModal]: State<boolean> = useState(false);
    const [selectedRole, setSelectedRole]: State<UserRole | undefined> = useState<UserRole>();
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

    const refresh = () => {
        roleService.getAll(filters, pagination).then(setRoles);
    };

    return (
        <DataTableCard
            title="Roles"
            description="Administra perfiles, descripcion y cantidad de permisos asignados."
            status={<span className="page-header-eyebrow">Registros: {roles.content.length}</span>}
            actions={
                <>
                    <button onClick={() => setShowModal(true)} className="btn btn-sm btn-primary">
                        <i className="fa fa-plus me-1"/>
                        <span>Agregar</span>
                    </button>
                    <LeftModal
                        title="Agregar rol"
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        className="w-[400px] h-full z-[9999]"
                    >
                        <RoleForm onSubmit={() => setShowModal(false)}/>
                    </LeftModal>
                </>
            }
            filters={<RoleFilter onFilter={handleUpdateFilter}/>}
            footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={roles}/>}
        >
            <table className="table-shell">
                <thead>
                <tr>
                    <th scope="col"></th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Descripcion</th>
                    <th scope="col">Permisos</th>
                    <th scope="col"></th>
                </tr>
                </thead>
                <tbody>
                {roles.content.length === 0 && (
                    <tr>
                        <td colSpan={5}>
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
                        <td>
                            <button className="table-link">
                                <i className="fa fa-pen text-2xs"/>
                            </button>
                        </td>
                        <td><strong>{role.name}</strong></td>
                        <td>{role.description}</td>
                        <td>{role.countAuthorities}</td>
                        <td className="text-right">
                            <Tooltip message="Permisos" placement="left">
                                <button
                                    className="table-link"
                                    onClick={() => {
                                        setSelectedRole(role);
                                        setShowAuthorities(true);
                                    }}
                                >
                                    <i className="fa fa-circle-info !text-base"/>
                                </button>
                            </Tooltip>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedRole && (
                <AuthoritiesModal
                    open={showAuthorities}
                    onClose={() => setShowAuthorities(false)}
                    roleName={selectedRole.name}
                    roleId={selectedRole.id}
                    initialAuthorities={selectedRole.authorities.map((authority) => authority.authority.id)}
                    onSaved={refresh}
                />
            )}
        </DataTableCard>
    );
};
