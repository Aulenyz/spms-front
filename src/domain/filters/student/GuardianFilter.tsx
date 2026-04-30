import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {UseForm} from "../../types/steoreotype";

export type GuardianFilterFormValue = {
    searchBy: string;
    criteria: string;
};

const placeholders: Record<string, string> = {
    document: "Ingrese el documento",
};

export const GuardianFilter = ({onFilter}: { onFilter: (value: Record<string, string>) => void }) => {
    const {register, handleSubmit, watch, setValue}: UseForm<GuardianFilterFormValue> = useForm<GuardianFilterFormValue>({
        defaultValues: {
            searchBy: 'document'
        },
        reValidateMode: 'onChange'
    });

    const handleFilter = ({searchBy, criteria}: GuardianFilterFormValue) => {
        onFilter({[searchBy]: criteria});
    };

    useEffect(() => {
        setValue("criteria", "");
    }, [watch("searchBy")]);

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="input input-sm flex w-full items-center gap-1 sm:w-72">
                <i className="fa fa-user text-xs"/>
                <input
                    type="text"
                    placeholder={placeholders[watch("searchBy")]}
                    {...register("criteria")}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit(handleFilter)();
                        }
                    }}
                />
            </label>

            <button type="button" onClick={handleSubmit(handleFilter)} className="btn btn-sm btn-outline btn-primary" title="Filtrar">
                <i className="fa fa-search"/>
            </button>
        </div>
    );
};
