import {useMemo} from "react";
import {useForm, useWatch} from "react-hook-form";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

type ProductCategoryFilterValues = {
    term: string;
    active: "" | "true" | "false";
};

export const ProductCategoryFilter = ({onFilter}: {onFilter: (filters: Record<string, string>) => void}) => {
    const {register, setValue, control} = useForm<ProductCategoryFilterValues>({
        defaultValues: {
            term: "",
            active: "true",
        },
    });

    const [term, active] = useWatch({control, name: ["term", "active"]});

    const filters = useMemo(() => ({term, active}), [term, active]);
    useFilterEmitter(filters, onFilter);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[170px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    value={active}
                    onSelect={(value) => setValue("active", (value ?? "true") as ProductCategoryFilterValues["active"])}
                    className="w-full"
                    options={[
                        {value: "true", description: "Activas"},
                        {value: "false", description: "Inactivas"},
                        {value: "", description: "Todas"},
                    ]}
                    portal
                />
            </div>

            <div className="w-full sm:w-[360px]">
                <label className="input input-sm flex w-full items-center gap-2">
                    <i className="fa fa-magnifying-glass text-xs"/>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o descripción..."
                        {...register("term")}
                    />
                </label>
            </div>
        </div>
    );
};
