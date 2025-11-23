import {Specialization} from "../../domain/model/course/Course.ts";
import {Link} from "react-router-dom";
import {useMemo} from "react";

interface Props {
    specialization: Specialization;
}

export const SpecializationCard = ({specialization}: Props) => {

    const initials = specialization.name
        .split(" ")
        .map(w => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    const COLORS = [
        "bg-red-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-yellow-500",
        "bg-purple-500",
        "bg-indigo-500",
        "bg-pink-500",
        "bg-teal-500",
    ];

    const randomColor = useMemo(() => {
        const index = Math.floor(Math.random() * COLORS.length);
        return COLORS[index];
    }, []);

    return (
        <div
            className="
                bg-white rounded-lg shadow-sm border border-gray-200
                hover:shadow-md transition-all
                w-full h-[260px] flex flex-col overflow-hidden
            "
        >
            <div className={`${randomColor} h-[90px] flex items-center justify-center`}>
                <span className="text-white text-3xl font-bold">
                    {initials}
                </span>
            </div>

            <div className="flex-1 p-3 flex flex-col justify-between">

                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                        {specialization.name}
                    </h3>

                    <p className="text-gray-600 text-xs line-clamp-3">
                        {specialization.description || "Sin descripción disponible."}
                    </p>

                    <div className="flex items-center text-gray-500 text-xs">
                        <i className="fa fa-layer-group mr-2 text-gray-400"></i>
                        {specialization.type}
                    </div>
                </div>

                <div className="pt-2">
                    <Link
                        to={`/specializations/${specialization.id}`}
                        className="
                            inline-flex items-center px-3 py-1.5 text-xs font-medium
                            text-white bg-blue-600 rounded-md hover:bg-blue-700 transition
                        "
                    >
                        Detalles
                        <i className="fa fa-chevron-right text-2xs ml-2"></i>
                    </Link>
                </div>

            </div>
        </div>
    );
};
