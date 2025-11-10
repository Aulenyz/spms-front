import {colorMap, StudentStatus, StudentStatusLabel} from "../../../../domain/student/Student.ts";

export const StudentStatusPill = ({status}: { status: StudentStatus }) => {
    const color = colorMap[status] || "bg-gray-500";
    return (
        <div className="flex items-center">
            {<div className={`h-2.5 w-2.5 rounded-full ${color} me-1`}/>}
            {StudentStatusLabel[status]}
        </div>
    )
}