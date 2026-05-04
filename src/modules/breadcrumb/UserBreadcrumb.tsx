import {useEffect, useState} from "react";
import {UserService} from "../../services/user/UserService.ts";
import {State} from "../../domain/types/steoreotype.ts";
import {mapColor, UserStatus, UserStatusLabel} from "../../domain/model/user/user.ts";
import {useAuthContext} from "../../contexts/AuthContext.tsx";
import {AuthorityKey} from "../../domain/model/user/authorities.ts";

const userService: UserService = UserService.instance;

export const UserBreadcrumb = ({onInvite}: {onInvite: () => void}) => {
    const {hasAuthority} = useAuthContext();
    const [status, setStatus]: State<Record<UserStatus, number>> = useState<Record<UserStatus, number>>({} as Record<UserStatus, number>);

    useEffect(() => {
        userService.getTotalByStatus().then(setStatus).catch(() => setStatus({} as Record<UserStatus, number>));
    }, []);

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
            style={{
                borderColor: "var(--border-soft)",
                background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                {Object.keys(status).map((value: string, index: number) => {
                    const key = value as keyof typeof UserStatus;
                    const colorClass = mapColor[key] || "bg-gray-100 text-gray-700 border-gray-300";
                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 ${colorClass}`}
                        >
                            <span className="text-sm font-medium">{UserStatusLabel[key]}:</span>
                            <span className="text-sm font-semibold">{status[key as UserStatus]}</span>
                        </div>
                    );
                })}
            </div>

            {hasAuthority(AuthorityKey.USER_INVITATION_CREATE) && (
                <div className="flex items-center gap-2">
                    <button className="btn btn-sm btn-success" onClick={onInvite} type="button">
                        <i className="fa fa-paper-plane me-1"/>
                        Invitar usuario
                    </button>
                </div>
            )}
        </div>
    );
};
