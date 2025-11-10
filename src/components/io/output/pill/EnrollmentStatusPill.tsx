import {EnrollmentStatus, EnrollmentStatusColorMap, EnrollmentStatusLabel} from "../../../../domain/student/Enrollment.ts";

export const EnrollmentStatusPill = ({status}: { status: EnrollmentStatus }) => {
    const color = EnrollmentStatusColorMap[status];

    return (
        <div className="flex items-center">
            <div className={`h-2.5 w-2.5 rounded-full ${color} me-2`} />
            {EnrollmentStatusLabel[status]}
        </div>
    );
};
