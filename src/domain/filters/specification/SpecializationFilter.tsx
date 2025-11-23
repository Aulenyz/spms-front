import {useForm} from "react-hook-form";
import {GradeType} from "../../model/course/Course.ts";

export const SpecializationFilter = ({onFilter,}: { onFilter: (filters: Record<string, any>) => void; }) => {
    const {watch, setValue} = useForm({
        defaultValues: {
            name: "",
            type: "",
        },
    });

    const handleChange = (key: "name" | "type", value: string) => {
        setValue(key, value);
    };

    const handleFilter = () => {
        const filters = {
            name: watch("name"),
            type: watch("type"),
        };
        onFilter(filters);
    };

    return (
        <div className="flex gap-4 items-end flex-wrap">
            {/* Tipo */}
            <div className="flex flex-col items-start gap-2">
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
                                {GradeType[key]}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Nombre */}
            <div className="flex flex-col items-start gap-2">
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
