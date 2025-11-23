    import {GradeTypeLabel, Specialization} from "../../domain/model/course/Course.ts";
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

        const statusColor = specialization.active ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300";
        const statusLabel = specialization.active ? "Activo" : "Inactivo";

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200
                    hover:shadow-md transition-all
                    w-full h-[250px] flex flex-col overflow-hidden
                "
            >
                {/* Header con color aleatorio */}
                <div className={`${randomColor} h-[90px] flex items-center justify-center`}>
                    <span className="text-white text-3xl font-bold">
                        {initials}
                    </span>
                </div>

                {/* Contenido */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                    <div className="space-y-1">
                        <div
                            className="flex justify-between">
                        <h1 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                                {specialization.name}
                            </h1>

                            <span className={` px-2 py-0.5 text-xs font-medium rounded border justify-end ${statusColor}`}>
                            {statusLabel}
                            </span>
                        </div>

                        <p className="text-gray-600 text-xs line-clamp-3">
                            {specialization.description || "Sin descripción disponible."}
                        </p>

                        <div className="flex items-center text-gray-500 text-xs">
                            <i className="fa fa-layer-group mr-2 text-gray-400"></i>
                            {GradeTypeLabel[specialization.type]}
                        </div>
                    </div>

                    <div className="pt-2">
                        <Link to={`/specializations/${specialization.id}`}
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
