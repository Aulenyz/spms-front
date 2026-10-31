import {useEffect, useMemo, useRef} from "react";
import {useForm, useWatch} from "react-hook-form";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
import {UseForm} from "../../types/steoreotype";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

export type GuardianFilterFormValue = {
    searchBy: "document" | "firstname" | "lastname";
    criteria: string;
};

export const GuardianFilter = ({onFilter}: { onFilter: (value: Record<string, string>) => void }) => {
    const {register, control, setValue}: UseForm<GuardianFilterFormValue> = useForm<GuardianFilterFormValue>({
        defaultValues: {
            searchBy: "document",
            criteria: "",
        },
        reValidateMode: "onChange",
    });

    const [searchBy, criteria] = useWatch({control, name: ["searchBy", "criteria"]});

    const filters = useMemo(
        () => (criteria?.trim() ? {[searchBy]: criteria} : {}) as Record<string, string>,
        [searchBy, criteria],
    );
    useFilterEmitter(filters, onFilter);

    // When changing filter type, clear criteria to avoid sending mismatched params (no en el montaje).
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        setValue("criteria", "");
    }, [searchBy, setValue]);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-44">
                <DropdownSelect
                    text="Filtrar por"
                    hasError={false}
                    value={searchBy}
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
                                onFilter(filters);
                            }
                        }}
                    />
                </label>
            </div>
        </div>
    );
};
