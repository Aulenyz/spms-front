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

const roleService: RoleService = RoleService.instance;

export const RoleListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [roles, setRoles]: State<Page<UserRole>> = useState(Pagination.empty<UserRole>());
    const [showAuthorities, setShowAuthorities]: State<boolean> = useState(false);
    const [showChangePassword, setShowChangePassword]: State<boolean> = useState(false);
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

    const handleUpdateFilter = (filters: KeyValueOf<string>) => {
        setFilters({...filters});
        handlePageChange(0);
    };

    const refresh = () => {
        roleService.getAll(filters, pagination).then(setRoles);
    };

    return (
        <div>
            <div>
                <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
                    <div className="flex flex-col justify-center gap-2">
                        <h1 className="text-xl font-medium leading-none text-gray-900">
                            Listado de Roles
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button onClick={() => {
                            refresh();
                            setShowChangePassword(true);
                        }} className="btn btn-sm btn-primary">
                            <i className="fa fa-plus mr-2"></i>
                            <span>Agregar</span>
                        </button>
                        <LeftModal title="Invitar usuario" isOpen={showChangePassword}
                                   onClose={() => setShowChangePassword(false)} className="w-[400px] h-full z-[9999]">
                            <RoleForm onSubmit={() => setShowChangePassword(false)}/>
                        </LeftModal>
                    </div>
                </div>
            </div>

            <div className="card relative overflow-x-auto mb-2 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Cantidad de Roles: {roles.content.length}</span>
                    </h3>
                    <RoleFilter onFilter={handleUpdateFilter}/>
                </div>

                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-[5%]"></th>
                        <th scope="col" className="px-6 py-3">Nombre</th>
                        <th scope="col" className="px-6 py-3">Descripción</th>
                        <th scope="col" className="px-6 py-3">Cantidad de Permisos</th>
                        <th scope="col" className="px-3 py-3 w-[5%]"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {roles.content.map((role: UserRole, index: number) => (
                        <tr key={index}
                            className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                            <td>
                                <button className="px-6 py-3">
                                    <i className="fa fa-edit text-2xs ms-1"/>
                                </button>
                            </td>
                            <td className="px-6 py-3">{role.name}</td>
                            <td className="px-6 py-3">{role.description}</td>
                            <td className="px-6 py-3">{role.countAuthorities}</td>
                            <td className="py-3">
                                <Tooltip message={'Permisos'} placement={'left'}>
                                    <button
                                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                        onClick={() => {
                                            setSelectedRole(role);
                                            setShowAuthorities(true);
                                        }}>
                                        <i className="fa fa-circle-info !text-xl"/>
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
                        initialAuthorities={selectedRole.authorities.map(a => a.authority.id)}
                        onSaved={refresh}
                    />
                )}
                <div>
                    <Pager onChange={handlePageChange} page={roles}/>
                </div>
            </div>
        </div>
    );
}