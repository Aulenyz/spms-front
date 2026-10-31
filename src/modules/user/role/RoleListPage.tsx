import {useCallback, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../../app/query/queryKeys.ts";
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
import {TableDetailAction} from "../../../components/ui/data/TableDetailAction.tsx";

const roleService: RoleService = RoleService.instance;
const EMPTY_PAGE: Page<UserRole> = Pagination.empty<UserRole>();

export const RoleListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [showModal, setShowModal]: State<boolean> = useState(false);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });

    const queryClient = useQueryClient();
    const {data: roles = EMPTY_PAGE} = useQuery({
        queryKey: queryKeys.roles.list({filters, pagination}),
        queryFn: ({signal}) => roleService.withSignal(signal).getAll(filters, pagination),
        placeholderData: keepPreviousData,
    });

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handlePageSizeChange = (size: number) => {
        setPagination((prev) => ({...prev, page: 0, size}));
    };

    const handleUpdateFilter = useCallback((nextFilters: KeyValueOf<string>) => {
        setFilters({...nextFilters});
        setPagination((prev) => ({...prev, page: 0}));
    }, []);

    return (
        <div className="space-y-6">
            <RoleBreadcrumb onCreate={() => setShowModal(true)}/>

            <DataTableCard
                title="Roles"
                description="Administra perfiles, descripción y cantidad de permisos asignados."
                filters={<RoleFilter onFilter={handleUpdateFilter}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={roles}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Nombre</th>
                        <th scope="col">Descripción</th>
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

                    {roles.content.map((role: UserRole) => (
                        <tr key={role.id}>
                            <td><strong>{role.name}</strong></td>
                            <td>{role.description}</td>
                            <td>{role.countAuthorities}</td>
                            <td className="text-right">
                                <TableDetailAction to={`/users/roles/${role.id}`} state={{role}}/>
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
                <RoleForm onSubmit={() => {
                    setShowModal(false);
                    void queryClient.invalidateQueries({queryKey: queryKeys.roles.all});
                }}/>
            </LeftModal>
        </div>
    );
};
