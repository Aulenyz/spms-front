import {ChangeEvent, KeyboardEvent, useEffect, useState} from "react";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {Pager} from "../../../components/io/input/Pager.tsx";
import clsx from "clsx";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthorityService} from "../../../services/user/AuthorityService.ts";
import {RoleService} from "../../../services/user/RoleService.ts";
import {Page, Pagination} from "../../../domain/filters/Page.ts";
import {UserAuthority} from "../../../domain/model/user/user.ts";
import {InputLabel} from "../../../components/io/input/InputLabel.tsx";

type AuthoritiesModalProps = {
    open: boolean;
    onClose: () => void;
    roleName?: string;
    roleId: number;
    initialAuthorities: number[];
    onSaved: () => void;
};

const authorityService = AuthorityService.instance;
const roleService = RoleService.instance;

export const AuthoritiesModal = ({open, onClose, roleName, roleId, initialAuthorities, onSaved,}: AuthoritiesModalProps) => {

    const [authorities, setAuthorities] = useState<Page<UserAuthority>>(Pagination.empty<UserAuthority>());
    const [pagination, setPagination] = useState<Pagination>(Pagination.first);
    const [selected, setSelected] = useState<number[]>([]);
    const [original, setOriginal] = useState<number[]>([]);
    const [search, setSearch] = useState<string>("");
    const [searchInput, setSearchInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!open) return;
        setIsLoading(true);
        const fetchAuthorities = search.trim() ? authorityService.search(search, pagination) : authorityService.getAll({sort: "createdAt,desc", ...pagination});
        fetchAuthorities.then(setAuthorities).finally(() => setIsLoading(false));
    }, [open, pagination.page, pagination.size, search]);

    useEffect(() => {
        if (!open) return;
        const init = initialAuthorities ?? [];
        setSelected(init);
        setOriginal(init);
    }, [open, initialAuthorities]);

    useEffect(() => {
        if (!open) {
            setSearch("");
            setSearchInput("");
            setAuthorities(Pagination.empty<UserAuthority>());
            setPagination(Pagination.first);
        }
    }, [open]);

    const handlerPageChange = (page: number) => setPagination(prev => ({...prev, page}));

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, id: number) => {
        setSelected(prev => (e.target.checked ? [...prev, id] : prev.filter(x => x !== id)));
    };

    const handleSave = async () => {
        setIsLoading(true);
        const toAssign = selected.filter(id => !original.includes(id));
        const toUnassign = original.filter(id => !selected.includes(id));

        if (toAssign.length) await roleService.assign(roleId, toAssign);
        if (toUnassign.length) await roleService.unassign(roleId, toUnassign);
        setIsLoading(false);
        onSaved();
        onClose();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") setSearch(searchInput);
    };

    return (
        <LeftModal isOpen={open} onClose={onClose} title="Permisos de Usuario" className="w-[35%] flex flex-col">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
                    <LoadingContent loading className="text-blue-600 fa-4x text-9xl"/>
                </div>
            )}

            <div className="w-full mb-2">
                <InputLabel labelText={'Rol'} value={roleName}></InputLabel>
            </div>

            <div className="flex items-center gap-3 py-3">
                <div className="relative flex-1">
                    <i className="fa fa-search absolute left-3 top-2.5 text-gray-400 text-sm"></i>
                    <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                           onKeyDown={handleKeyDown} placeholder="Buscar permisos..."
                           className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                    />
                </div>
                <button onClick={() => setSearch(searchInput)}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                    Buscar
                </button>
            </div>

            <div className="relative flex flex-col flex-grow overflow-hidden mt-2">
                <div className="flex-grow scrollable-y-auto">
                    {authorities.content.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {authorities.content.map((auth) => {
                                const checked = selected.includes(auth.id);
                                return (
                                    <li key={auth.id}
                                        className={clsx("flex items-center gap-3 py-2 ps-2 cursor-pointer group transition-all duration-150 ease-in-out",
                                            {
                                                "bg-blue-50/40": checked,
                                                "hover:bg-gray-50": !checked,
                                            }
                                        )}
                                        onClick={() =>
                                            handleCheckboxChange(
                                                {target: {checked: !checked}} as ChangeEvent<HTMLInputElement>,
                                                auth.id
                                            )
                                        }
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => handleCheckboxChange(e, auth.id)}
                                            className="w-4 h-4 cursor-pointer accent-blue-600 rounded-sm ml-1"
                                        />
                                        <div className="flex flex-col flex-1 leading-tight">
                                            <span
                                                className="text-[13px] font-medium text-gray-900 group-hover:text-blue-600">
                                                {auth.name}
                                            </span>
                                            <span className="text-[12px] text-gray-500">
                                                {auth.description || "Permiso del sistema."}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                            No hay permisos disponibles.
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <Pager page={authorities} onChange={handlerPageChange} compact={true}/>
                </div>
            </div>

            <div className="flex justify-end mt-2">
                <button onClick={handleSave} className="btn btn-sm btn-primary flex items-center gap-2">
                    Guardar <i className="fa fa-save"/>
                </button>
            </div>
        </LeftModal>
    );
};
