import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {UseForm} from "../../types/steoreotype";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

export type GuardianFilterFormValue = {
    searchBy: "document" | "firstname" | "lastname";
    criteria: string;
};

export const GuardianFilter = ({onFilter}: { onFilter: (value: Record<string, string>) => void }) => {
    const {register, watch, setValue}: UseForm<GuardianFilterFormValue> = useForm<GuardianFilterFormValue>({
        defaultValues: {
            searchBy: "document",
            criteria: "",
        },
        reValidateMode: "onChange",
    });

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            const searchBy = watch("searchBy");
            const criteria = watch("criteria");
            onFilter(criteria?.trim() ? {[searchBy]: criteria} : {});
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("searchBy"), watch("criteria")]);

    useEffect(() => {
        // When changing filter type, clear criteria to avoid sending mismatched params.
        setValue("criteria", "");
    }, [watch("searchBy")]);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-44">
                <DropdownSelect
                    text="Filtrar por"
                    hasError={false}
                    value={watch("searchBy")}
                    onSelect={(value) => setValue("searchBy", (value ?? "document") as any)}
                    className="w-full"
                    options={[
                        {value: "document", description: "Documento"},
                        {value: "firstname", description: "Nombre"},
                        {value: "lastname", description: "Apellido"},
                    ]}
                />
            </div>

            <div className="w-full sm:w-72">
                <label className="input input-sm flex w-full items-center gap-2">
                    <i className="fa fa-magnifying-glass text-xs"/>
                    <input
                        type="text"
                        placeholder="Escribe para buscar..."
                        {...register("criteria")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const searchBy = watch("searchBy");
                                const criteria = watch("criteria");
                                onFilter(criteria?.trim() ? {[searchBy]: criteria} : {});
                            }
                        }}
                    />
                </label>
            </div>
        </div>
    );
};
