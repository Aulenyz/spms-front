import {useEffect, useState} from "react";
import {InvitationStatus, UserInvitation} from "../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {KeyValueOf, State} from "../../../domain/types/steoreotype.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {UserInvitationService} from "../../../services/user/UserInvitationService.ts";
import {UserInvitationFilter} from "../../../domain/filters/user/UserInvitationFilter.tsx";
import {UserInvitationStatusPill} from "../../../components/io/output/pill/UserInvitationStatusPill.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {UserInvitationForm} from "./create/UserInvitationForm.tsx";

const userInvitationService: UserInvitationService = UserInvitationService.instance;

export const UserInvitationListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [invitations, setInvitations]: State<Page<UserInvitation>> = useState(Pagination.empty<UserInvitation>());
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({});
    const [showChangePassword, setShowChangePassword]: State<boolean> = useState(false);

    useEffect(() => {
        userInvitationService.getAll(filters, pagination).then(setInvitations);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleUpdateFilter = (filters: KeyValueOf<string>) => {
        setFilters({...filters});
        handlePageChange(0);
    };

    return (
        <div>
            <div>
                <div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
                    <div className="flex flex-col justify-center gap-2">
                        <h1 className="text-xl font-medium leading-none text-gray-900">
                            Lista de Invitaciones
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button onClick={() => {
                            setShowChangePassword(true);
                        }} className="btn btn-sm btn-success">
                            <i className="fa fa-paper-plane mr-2"></i>
                            <span>Invitar usuario</span>
                        </button>
                        <LeftModal title="Invitar usuario" isOpen={showChangePassword}
                                   onClose={() => setShowChangePassword(false)} className="w-[400px] h-full z-[9999]">
                            <UserInvitationForm onSubmit={() => setShowChangePassword(false)}/>
                        </LeftModal>
                    </div>
                </div>
            </div>

            <div className="card relative overflow-x-auto mb-2 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Mostrando Invitaciones:</span>
                        <UserInvitationStatusPill status={filters.status as InvitationStatus}/>
                    </h3>
                    <UserInvitationFilter onFilter={handleUpdateFilter}/>
                </div>

                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>

                        <th scope="col" className="px-20 py-3">Correo</th>
                        <th scope="col" className="px-6 py-3">Role</th>
                        <th scope="col" className="px-6 py-3">Estado</th>
                        <th scope="col" className="px-6 py-3">Enviado por</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invitations.content.map((userInvitation: UserInvitation, index: number) => (
                        <tr key={index}
                            className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                            <td className="px-20 py-3">{userInvitation.email}</td>
                            <td className="px-6 py-3">{userInvitation.role.name}</td>
                            <td className="px-6 py-3">{<UserInvitationStatusPill
                                status={userInvitation.status as InvitationStatus}/>}</td>
                            <td className="px-6 py-3">{userInvitation.createdBy.name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div>
                    <Pager onChange={handlePageChange} page={invitations}/>
                </div>
            </div>
        </div>
    );
}