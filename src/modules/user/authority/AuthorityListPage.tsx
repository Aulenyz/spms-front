import {useEffect, useState} from "react";
import {UserAuthority} from "../../../domain/model/user/user.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {KeyValueOf, State} from "../../../domain/types/steoreotype.ts";
import {Pager} from "../../../components/io/input/Pager.tsx";
import {RoleFilter} from "../../../domain/filters/user/RoleFilter.tsx";
import {AuthorityService} from "../../../services/user/AuthorityService.ts";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {AuthorityForm} from "./create/AuthorityForm.tsx";

const authorityService: AuthorityService = AuthorityService.instance;

export const AuthorityListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [authorities, setAuthorities]: State<Page<UserAuthority>> = useState(Pagination.empty<UserAuthority>());
    const [showChangePassword, setShowChangePassword]: State<boolean> = useState(false);
    const [filters, setFilters]: State<KeyValueOf<string>> = useState<KeyValueOf<string>>({});

    useEffect(() => {
        authorityService.getAll(filters, pagination).then(setAuthorities);
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
                            Variables del Sistema
                        </h1>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button onClick={() => {
                            setShowChangePassword(true);
                        }} className="btn btn-sm btn-primary">
                            <i className="fa fa-plus mr-2"></i>
                            <span>Agregar</span>
                        </button>
                        <LeftModal title="Agregar Variable" isOpen={showChangePassword}
                                   onClose={() => setShowChangePassword(false)} className="w-[400px] h-full z-[9999]">
                            <AuthorityForm onSubmit={() => setShowChangePassword(false)}/>
                        </LeftModal>
                    </div>
                </div>
            </div>

            <div className="card relative overflow-x-auto mb-2 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md">
                    <h3 className="card-title font-medium text-sm inline-flex items-center">
                        <span className="mr-2">Cantidad de Permisos: {authorities.content.length}</span>
                    </h3>
                    <RoleFilter onFilter={handleUpdateFilter}/>
                </div>

                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Llave</th>
                        <th scope="col" className="px-6 py-3">Nombre</th>
                        <th scope="col" className="px-6 py-3">Descripción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {authorities.content.map((role: UserAuthority, index: number) => (
                        <tr key={index}
                            className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                            <td className="px-6 py-3">{role.key}</td>
                            <td className="px-6 py-3">{role.name}</td>
                            <td className="px-6 py-3">{role.description}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div>
                    <Pager onChange={handlePageChange} page={authorities}/>
                </div>
            </div>
        </div>
    );
}