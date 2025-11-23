import {useForm} from "react-hook-form";
import {GradeType, GradeTypeLabel} from "../../model/course/Course.ts";

export const SpecializationFilter = ({onFilter}: { onFilter: (filters: Record<string, any>) => void }) => {
    const {watch, setValue} = useForm({
        defaultValues: {
            name: "",
            type: "",
            active: "true",
        },
    });

    const handleChange = (key: "name" | "type" | "active", value: string) => {
        setValue(key, value);
    };

    const handleFilter = () => {
        onFilter({
            name: watch("name"),
            type: watch("type"),
            active: watch("active"),
        });
    };

    return (
        <div className="flex gap-4 items-end flex-wrap">

            {/* Estado */}
            <div className="flex flex-col items-start gap-1">
                <select
                    className="select select-sm w-32 bg-transparent"
                    value={watch("active")}
                    onChange={(e) => handleChange("active", e.target.value)}
                >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                </select>
            </div>

            {/* Tipo */}
            <div className="flex flex-col items-start gap-1">
                <select
                    className="select select-sm w-40 bg-transparent"
                    value={watch("type")}
                    onChange={(e) => handleChange("type", e.target.value)}
                >
                    <option value="">Todos</option>

                    {Object.keys(GradeType).map((t) => {
                        const key = t as keyof typeof GradeType;
                        return (
                            <option key={key} value={GradeType[key]}>
                                {GradeTypeLabel[GradeType[key]]}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Nombre */}
            <div className="flex flex-col items-start gap-1">
                <input
                    className="input input-sm w-56"
                    type="text"
                    placeholder="Buscar por nombre"
                    value={watch("name")}
                    onChange={(e) => handleChange("name", e.target.value)}
                />
            </div>

            {/* Botón */}
            <button type="button" className="btn btn-sm btn-outline btn-primary" onClick={handleFilter}>
                <i className="fa fa-search mr-1"/>
                Filtrar
            </button>
        </div>
    );
};
