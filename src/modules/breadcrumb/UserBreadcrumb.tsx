import {useEffect, useState} from "react";
import {State} from "../../domain/types/steoreotype.ts";
import {mapColor, statusOrder, UserStatus, UserStatusLabel} from "../../domain/model/user/user.ts";
import {UserService} from "../../services/user/UserService.ts";

const userService: UserService = UserService.instance;

export const UserBreadcrumb = () => {

    const [status, setStatus]: State<Record<UserStatus, number>> = useState<Record<UserStatus, number>>({} as Record<UserStatus, number>)

    useEffect(() => {
        userService.getTotalByStatus().then(setStatus)
    }, []);

    return (<div className="flex flex-wrap items-center lg:items-end justify-between gap-5 pb-7.5">
            <div className="flex flex-col justify-center gap-2">
                <h1 className="text-xl font-medium leading-none text-gray-900">
                    Listado de Usuarios
                </h1>
                <div className="flex items-center flex-wrap gap-2 font-medium">
                    {statusOrder.map((key) => {
                        if (status[key] === undefined) return null;
                        const colorClass = mapColor[key] || "bg-gray-100 text-gray-700 border-gray-300";
                        return (
                            <div key={key}
                                 className={`flex items-center gap-1 px-2 py-1 rounded-full border ${colorClass}`}>
                                <span className="text-sm font-medium">
                                    {UserStatusLabel[key]}:
                                </span>
                                <span className="text-sm font-semibold">{status[key]} </span>
                            </div>);
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                <a className="btn btn-sm btn-primary" href="#">
                    <i className="fa fa-user-plus me-1"/>
                    Registrar
                </a>
            </div>
        </div>
    )
}
