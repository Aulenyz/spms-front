import {StudentStatus, StudentStatusLabel} from "../../../../domain/student/Student.ts";

export const StudentStatusPill = ({status}: { status: StudentStatus }) => {

    switch (status) {
        case StudentStatus.ACTIVE: {
            return (
                <div className="flex items-center">
                    {<div className="h-2.5 w-2.5 rounded-full bg-green-500 me-1"/>}
                    {StudentStatusLabel[status]}
                </div>
            )
        }
        case StudentStatus.INACTIVE: {
            return (
                <div className="flex items-center">
                    {<div className="h-2.5 w-2.5 rounded-full bg-red-500 me-1"/>}
                    {StudentStatusLabel[status]}
                </div>
            )
        }
        case StudentStatus.GRADUATED: {
            return (
                <div className="flex items-center">
                    {<div className="h-2.5 w-2.5 rounded-full bg-red-500 me-1"/>}
                    {StudentStatusLabel[status]}
                </div>
            )
        }
        default:
            return (
                <div className="flex items-center">
                    {<div className="h-2.5 w-2.5 rounded-full bg-gray-500 me-1"/>}
                    {StudentStatusLabel[status]}
                </div>
            )
    }
}