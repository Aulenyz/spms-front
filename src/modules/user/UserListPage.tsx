import {useEffect, useState} from "react";
import {KeyValueOf, State} from "../../domain/types/steoreotype.ts";
import {UserService} from "../../services/user/UserService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {Link} from "react-router-dom";
import {StudentGenderPill} from "../../components/io/output/pill/StudentGenderPill.tsx";
import {UserStatusPill} from "../../components/io/output/pill/UserStatusPill.tsx";
import {UserBreadcrumb} from "../breadcrumb/UserBreadcrumb.tsx";
import {UserFilter} from "../../domain/filters/user/UserFilter.tsx";

const userService: UserService = UserService.instance;

export const UserListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [users, setUsers]: State<Page<User>> = useState(Pagination.empty<User>());
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({
        status: "ACTIVE",
    });

    useEffect(() => {
        userService.getAll(filters, pagination).then(setUsers);
    }, [pagination, filters]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleUpdateFilter = (filters: KeyValueOf<string>) => {
        setFilters({...filters});
        handlePageChange(0);
    };

    return (
        <div className="pt-6 pl-9 pr-5">
            <div>
                <UserBreadcrumb/>
            </div>

            <div className="card relative overflow-x-auto mb-6 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Mostrando Usuarios:</span>
                        <UserStatusPill status={filters.status as UserStatus}/>
                    </h3>
                    <UserFilter onFilter={handleUpdateFilter}/>
                </div>

                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Nombre</th>
                        <th scope="col" className="px-6 py-3">Documento</th>
                        <th scope="col" className="px-6 py-3">Rol</th>
                        <th scope="col" className="px-6 py-3">Género</th>
                        <th scope="col" className="px-6 py-3">Estatus</th>
                        <th scope="col" className="px-3 py-3 w-[5%]"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.content.map((user: User, index: number) => (
                        <tr key={index}
                            className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                            <td className="px-6 py-3">{user.info.firstname} {user.info.lastname}</td>
                            <td className="px-6 py-3">{user.document}</td>
                            <td className="px-6 py-3">{user.role.name.charAt(0).toUpperCase() + user.role.name.slice(1).toLowerCase()}</td>
                            <td className="px-6 py-3">
                                <StudentGenderPill gender={user.info.gender}/>
                            </td>
                            <td className="px-6 py-3">
                                <UserStatusPill status={user.status}/>
                            </td>
                            <td className="px-3 py-3 text-right">
                                <Link to="#" className="font-medium text-blue-600 hover:underline whitespace-nowrap">
                                    Detalles
                                    <i className="fa fa-chevron-right text-2xs ms-1"/>
                                </Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div>
                    <Pager onChange={handlePageChange} page={users}/>
                </div>
            </div>
        </div>
    );
}