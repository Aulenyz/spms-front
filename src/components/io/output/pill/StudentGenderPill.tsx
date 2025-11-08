import {Gender, Genders} from "../../../../domain/model/user/user.ts";

export const StudentGenderPill = ({gender}: { gender: Gender }) => {
    switch (gender) {
        case Gender.MALE: {
            return (
                <div className="flex items-center">
                    {<div className="h-2.5 w-2.5 rounded-full bg-green-500 me-1"/>}
                    {Genders[gender]}
                </div>
            )
        }
        default:
            return (
                <div className="flex items-center">
                    {<div className="h-2.5 w-2.5 rounded-full bg-gray-500 me-1"/>}
                    {Gender[gender]}
                </div>
            )
    }
}