import {Gender, Genders} from "../../../../domain/model/user/user.ts";

const GenderColor: Record<Gender, string> = {
    [Gender.MALE]: "bg-green-500",
    [Gender.FEMALE]: "bg-pink-500",
    [Gender.OTHER]: "bg-gray-500",
};

/** Género del estudiante en español, con su color. */
export const StudentGenderPill = ({gender}: { gender: Gender }) => (
    <div className="flex items-center">
        <div className={`h-2.5 w-2.5 rounded-full me-1 ${GenderColor[gender] ?? "bg-gray-500"}`}/>
        {Genders[gender] ?? gender}
    </div>
);
