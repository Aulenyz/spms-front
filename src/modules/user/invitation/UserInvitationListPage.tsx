import {useCallback, useState} from "react";
import {keepPreviousData, useQuery, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {InvitationStatus, UserInvitation} from "../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {KeyValueOf, State} from "../../../domain/types/steoreotype.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {UserInvitationService} from "../../../services/user/UserInvitationService.ts";
import {UserInvitationFilter} from "../../../domain/filters/user/UserInvitationFilter.tsx";
import {UserInvitationStatusPill} from "../../../components/io/output/pill/UserInvitationStatusPill.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {UserInvitationForm} from "./create/UserInvitationForm.tsx";
import {DataTableCard} from "../../../components/ui/data/DataTableCard.tsx";
import {EmptyState} from "../../../components/ui/feedback/EmptyState.tsx";
import {InvitationBreadcrumb} from "../../breadcrumb/InvitationBreadcrumb.tsx";

const userInvitationService: UserInvitationService = UserInvitationService.instance;
const EMPTY_PAGE: Page<UserInvitation> = Pagination.empty<UserInvitation>();

export const UserInvitationListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({});
    const [showModal, setShowModal]: State<boolean> = useState(false);

    const queryClient = useQueryClient();
    const {data: invitations = EMPTY_PAGE} = useQuery({
        queryKey: queryKeys.invitations.list({filters, pagination}),
        queryFn: ({signal}) => userInvitationService.withSignal(signal).getAll(filters, pagination),
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
            <InvitationBreadcrumb onInvite={() => setShowModal(true)}/>

            <DataTableCard
                title="Invitaciones"
                description="Consulta invitaciones enviadas, rol asignado y estado de respuesta."
                status={<UserInvitationStatusPill status={filters.status as InvitationStatus}/>}
                filters={<UserInvitationFilter onFilter={handleUpdateFilter}/>}
                footer={<Pager onChange={handlePageChange} onPageSizeChange={handlePageSizeChange} page={invitations}/>}
            >
                <table className="table-shell">
                    <thead>
                    <tr>
                        <th scope="col">Correo</th>
                        <th scope="col">Rol</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Enviado por</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invitations.content.length === 0 && (
                        <tr>
                            <td colSpan={4}>
                                <EmptyState
                                    title="No hay invitaciones registradas"
                                    description="Crea una nueva invitación o cambia los filtros para continuar."
                                    icon="fa-paper-plane"
                                />
                            </td>
                        </tr>
                    )}
                    {invitations.content.map((userInvitation: UserInvitation) => (
                        <tr key={userInvitation.id}>
                            <td><strong>{userInvitation.email}</strong></td>
                            <td>{userInvitation.role.name}</td>
                            <td><UserInvitationStatusPill status={userInvitation.status as InvitationStatus}/></td>
                            <td>{userInvitation.createdBy.name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </DataTableCard>

            <LeftModal
                title="Invitar usuario"
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <UserInvitationForm onSubmit={() => {
                    setShowModal(false);
                    void queryClient.invalidateQueries({queryKey: queryKeys.invitations.all});
                }}/>
            </LeftModal>
        </div>
    );
};
