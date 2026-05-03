import {useForm} from "react-hook-form";
import {GradeType, GradeTypeLabel} from "../../model/course/Course.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {useEffect} from "react";

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

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            handleFilter();
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("name"), watch("type"), watch("active")]);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    value={watch("active")}
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
                    value={watch("type")}
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
                    value={watch("name")}
                    onChange={(e) => handleChange("name", e.target.value)}
                />
            </div>
        </div>
    );
};
