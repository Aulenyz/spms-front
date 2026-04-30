import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {Select, SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {UserStatus} from "../../model/user/user.ts";

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

    const {register, handleSubmit, watch, setValue}: UseForm<UserFilterFormValue> = useForm<UserFilterFormValue>({
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

    return (
        <form onSubmit={handleSubmit(handleFilter)} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <Select {...register('status')} className="select-sm w-full" options={useStatusFilter}></Select>
            </div>
            <div className="w-full sm:w-[140px]">
                <Select {...register('searchBy')} className="select-sm w-full" options={SearchByOptions}/>
            </div>
            <label className="input input-sm w-full sm:w-56">
                <i className="fa fa-user me-1"/>
                <input placeholder={placeholders[watch('searchBy')]} type="text" {...register('criteria')}/>
            </label>
            <button className="btn btn-sm btn-outline btn-primary">
                <i className="fa fa-search"/>
                Filtrar
            </button>
        </form>
    );
};
