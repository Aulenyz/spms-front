import {useMemo} from "react";
import {useForm, useWatch} from "react-hook-form";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";

type FormValues = {
    term: string;
    active: "" | "true" | "false";
};

export const SubjectFilter = ({onFilter}: { onFilter: (value: Record<string, any>) => void }) => {
    const {register, control, setValue} = useForm<FormValues>({
        defaultValues: {term: "", active: "true"},
        reValidateMode: "onChange",
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
                    onSelect={(value) => setValue("active", (value ?? "true") as any)}
                    className="w-full"
                    options={[
                        {value: "true", description: "Activas"},
                        {value: "false", description: "Inactivas"},
                        {value: "", description: "Todas"},
                    ]}
                    portal
                />
            </div>

            <div className="w-full sm:w-[280px]">
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
