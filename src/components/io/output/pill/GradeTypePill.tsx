import {GradeType, GradeTypeLabel} from "../../../../domain/model/course/Course.ts";

const colorMap: Record<GradeType, {dot: string; bg: string; border: string; text: string}> = {
    [GradeType.PRIMARY]: {dot: "bg-blue-500", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900"},
    [GradeType.SECONDARY]: {dot: "bg-violet-500", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-900"},
    [GradeType.TECHNICAL]: {dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900"},
};

export const GradeTypePill = ({type}: { type?: GradeType | null }) => {
    if (!type) return <span>-</span>;
    const palette = colorMap[type] ?? colorMap[GradeType.PRIMARY];
    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${palette.bg} ${palette.border} ${palette.text}`}>
            <span className={`h-2 w-2 rounded-full ${palette.dot}`}/>
            {GradeTypeLabel[type] ?? String(type)}
        </span>
    );
};

