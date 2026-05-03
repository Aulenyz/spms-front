import {useEffect, useState} from "react";
import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {UserService} from "../../services/user/UserService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {Link} from "react-router-dom";
import {StudentGenderPill} from "../../components/io/output/pill/StudentGenderPill.tsx";
import {UserStatusPill} from "../../components/io/output/pill/UserStatusPill.tsx";
import {UserFilter} from "../../domain/filters/user/UserFilter.tsx";
import {LeftModal} from "../../components/shared/LeftModal.tsx";
import {UserInvitationForm} from "./invitation/create/UserInvitationForm.tsx";
import {DataTableCard} from "../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../components/ui/feedback/EmptyState.tsx";
import {UserBreadcrumb} from "../breadcrumb/UserBreadcrumb.tsx";

const userService: UserService = UserService.instance;

export const UserListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [users, setUsers]: State<Page<User>> = useState(Pagination.empty<User>());
    const [showInvitationModal, setShowInvitationModal]: State<boolean> = useState(false);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });

    useEffect(() => {
        userService.getAll(filters, pagination).then(setUsers);
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
            <UserBreadcrumb onInvite={() => setShowInvitationModal(true)}/>

            <DataTableCard
                title="Usuarios"
                description="Consulta cuentas activas, rol asignado y estado de acceso."
                status={<UserStatusPill status={filters.status as UserStatus}/>}
                filters={<UserFilter onFilter={handleUpdateFilter}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={users}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Nombre</th>
                        <th scope="col">Documento</th>
                        <th scope="col">Rol</th>
                        <th scope="col">Genero</th>
                        <th scope="col">Estado</th>
                        <th scope="col"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.content.length === 0 && (
                        <tr>
                            <td colSpan={6}>
                                <EmptyState
                                    title="No hay usuarios para mostrar"
                                    description="Prueba otros filtros o crea una nueva invitacion."
                                    icon="fa-users"
                                />
                            </td>
                        </tr>
                    )}

                    {users.content.map((user: User, index: number) => (
                        <tr key={index}>
                            <td><strong>{user.info.firstname} {user.info.lastname}</strong></td>
                            <td>{user.document}</td>
                            <td>{user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1).toLowerCase()}</td>
                            <td><StudentGenderPill gender={user.info.gender}/></td>
                            <td><UserStatusPill status={user.status}/></td>
                            <td className="text-right">
                                <Link to={`/users/${user.id}`} className="table-link whitespace-nowrap">
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
                title="Invitar usuario"
                isOpen={showInvitationModal}
                onClose={() => setShowInvitationModal(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <UserInvitationForm onSubmit={() => setShowInvitationModal(false)}/>
            </LeftModal>
        </div>
    );
};
