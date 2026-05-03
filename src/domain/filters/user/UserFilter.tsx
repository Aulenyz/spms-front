import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {UserStatus} from "../../model/user/user.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

const placeholders: Record<string, string> = {
    name: 'Ingrese el nombre',
    document: 'Ingrese el documento',
}

const useStatusFilter: Array<SelectOption> = [
    {
        description: 'Activo',
        value: 'ACTIVE'
    },
    {
        description: 'Inactivo',
        value: 'INACTIVE'
    },
    {
        description: 'Cancelado',
        value: 'CANCELLED'
    }
];

const SearchByOptions: Array<SelectOption> = [
    {
        description: 'Nombre',
        value: 'name'
    },
    {
        description: 'Documento',
        value: 'document'
    }
];

export type UserFilterFormValue = {
    status: UserStatus;
    searchBy: string;
    criteria: string;
}

export const UserFilter = (props: { onFilter: (value: Record<string, string>) => void }) => {

    const {register, watch, setValue}: UseForm<UserFilterFormValue> = useForm<UserFilterFormValue>({
        defaultValues: {
            status: UserStatus.ACTIVE,
            searchBy: 'name'
        },
        reValidateMode: 'onChange'
    });

    const handleFilter = ({status, searchBy, criteria}: UserFilterFormValue) => {
        const filters: Record<string, string> = {status}
        filters[searchBy] = criteria;
        props.onFilter(filters);
    }

    useEffect(() => setValue('criteria', ''), [watch('status'), watch('searchBy')]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            handleFilter({
                status: watch("status"),
                searchBy: watch("searchBy"),
                criteria: watch("criteria") ?? "",
            });
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("status"), watch("searchBy"), watch("criteria")]);

    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    options={useStatusFilter}
                    value={watch("status")}
                    onSelect={(value) => setValue("status", value as UserStatus)}
                    className="w-full"
                />
            </div>
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Buscar por"
                    hasError={false}
                    options={SearchByOptions}
                    value={watch("searchBy")}
                    onSelect={(value) => setValue("searchBy", String(value ?? "name"))}
                    className="w-full"
                />
            </div>
            <label className="input input-sm w-full sm:w-56">
                <i className="fa fa-user me-1"/>
                <input placeholder={placeholders[watch('searchBy')]} type="text" {...register('criteria')}/>
            </label>
        </form>
    );
};
