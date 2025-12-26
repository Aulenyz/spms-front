import {invitationColorMap, InvitationStatus, InvitationStatusLabel} from "../../../../domain/model/user/user.ts";

export const UserInvitationStatusPill = ({status}: { status: InvitationStatus }) => {
    const color = invitationColorMap[status] || "bg-gray-500";
    return (
        <div className="flex items-center">
            {<div className={`h-2.5 w-2.5 rounded-full ${color} me-1`}/>}
            {InvitationStatusLabel[status]}
        </div>
    )
}