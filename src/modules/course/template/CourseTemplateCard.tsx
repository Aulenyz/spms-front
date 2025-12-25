import {useMemo} from "react";
import {CourseTemplate, GradeTypeLabel,} from "../../../domain/model/course/Course";

interface Props {
    courseTemplate: CourseTemplate;
}

const COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500",];

export const CourseTemplateCard = ({courseTemplate}: Props) => {
    const {specialization, count} = courseTemplate;
    const {name, description, type} = specialization;
    const initials = useMemo(() => name.split(" ").map((word) => word.charAt(0).toUpperCase()).slice(0, 2).join(""), [name]);

    const headerColor = useMemo(() => {
        const index = Math.floor(Math.random() * COLORS.length);
        return COLORS[index];
    }, []);

    return (
        <div
            className="w-full h-[250px] bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
            {/* Header */}
            <div className={`${headerColor} h-[90px] flex items-center justify-center`}>
                <span className="text-white text-3xl font-bold">{initials}</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between">
                <div className="space-y-2">
                    {/* Title + Status */}
                    <div className="flex justify-between items-start gap-2">
                        <h2 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                            {name}
                        </h2>
                        <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border bg-green-100 text-green-700 border-green-300`}>
               {count} secciones
            </span>
                    </div>
                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-3">
                        {description || "Sin descripción disponible."}
                    </p>
                    {/* Grade type */}
                    <div className="flex items-center text-xs text-gray-500">
                        <i className="fa fa-layer-group mr-2 text-gray-400"/>
                        {GradeTypeLabel[type]}
                    </div>
                </div>
            </div>
        </div>
    );
};
