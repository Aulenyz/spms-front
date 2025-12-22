import {colorMap, UserStatus, UserStatusLabel} from "../../../../domain/model/user/user.ts";

export const UserStatusPill = ({status}: { status: UserStatus }) => {
    const color = colorMap[status] || "bg-gray-500";
    return (
        <div className="flex items-center">
            {<div className={`h-2.5 w-2.5 rounded-full ${color} me-1`}/>}
            {UserStatusLabel[status]}
        </div>
    )
}