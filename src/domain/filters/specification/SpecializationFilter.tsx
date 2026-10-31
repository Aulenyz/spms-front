import {useForm, useWatch} from "react-hook-form";
import {GradeType, GradeTypeLabel} from "../../model/course/Course.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {useMemo} from "react";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
import {SPECIALIZATION_FILTER_DEFAULTS} from "./specializationFilterDefaults.ts";


export const SpecializationFilter = ({onFilter}: { onFilter: (filters: Record<string, any>) => void }) => {
    const {control, setValue} = useForm({
        defaultValues: SPECIALIZATION_FILTER_DEFAULTS,
    });
    const [name, type, active] = useWatch({control, name: ["name", "type", "active"]});

    const handleChange = (key: "name" | "type" | "active", value: string) => {
        setValue(key, value);
    };

    const filters = useMemo(() => ({name, type, active}), [name, type, active]);
    useFilterEmitter(filters, onFilter);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    value={active}
                    onSelect={(value) => handleChange("active", String(value ?? "true"))}
                    className="w-full"
                    options={[
                        {value: "true", description: "Activo"},
                        {value: "false", description: "Inactivo"},
                    ]}
                />
            </div>

            <div className="w-full sm:w-[160px]">
                <DropdownSelect
                    text="Tipo"
                    hasError={false}
                    value={type}
                    onSelect={(value) => handleChange("type", String(value ?? ""))}
                    className="w-full"
                    options={[
                        {value: "", description: "Todos"},
                        ...Object.keys(GradeType).map((t) => {
                            const key = t as keyof typeof GradeType;
                            return {value: GradeType[key], description: GradeTypeLabel[GradeType[key]]};
                        }),
                    ]}
                />
            </div>

            <div className="w-full sm:w-56">
                <input
                    className="input input-sm w-full"
                    type="text"
                    placeholder="Buscar por nombre"
                    value={name}
                    onChange={(e) => handleChange("name", e.target.value)}
                />
            </div>
        </div>
    );
};
