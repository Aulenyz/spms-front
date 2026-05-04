import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

type FormValues = {
    term: string;
    active: "" | "true" | "false";
};

export const SubjectFilter = ({onFilter}: { onFilter: (value: Record<string, any>) => void }) => {
    const {register, watch, setValue} = useForm<FormValues>({
        defaultValues: {term: "", active: "true"},
        reValidateMode: "onChange",
    });

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            onFilter({
                term: watch("term"),
                active: watch("active"),
            });
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("term"), watch("active")]);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[170px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    value={watch("active")}
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
                        placeholder="Buscar por nombre, codigo o descripcion..."
                        {...register("term")}
                    />
                </label>
            </div>
        </div>
    );
};
