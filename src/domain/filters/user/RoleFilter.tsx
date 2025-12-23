import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {UseForm} from "../../types/steoreotype.ts";

const placeholders: Record<string, string> = {
    name: 'Ingrese el nombre',
}

export type UserFilterFormValue = {
    searchBy: string;
    criteria: string;
}

export const RoleFilter = (props: { onFilter: (value: Record<string, string>) => void }) => {

    const {register, handleSubmit, watch, setValue}: UseForm<UserFilterFormValue> = useForm<UserFilterFormValue>({
        defaultValues: {
            searchBy: 'name'
        },
        reValidateMode: 'onChange'
    });

    const handleFilter = ({searchBy, criteria}: UserFilterFormValue) => {
        const filters: Record<string, string> = {}
        filters[searchBy] = criteria;
        props.onFilter(filters);
    }

    useEffect(() => setValue('criteria', ''), [watch('searchBy')]);

    return (
        <form onSubmit={handleSubmit(handleFilter)} className="flex flex-wrap gap-2.5">
            <div className="flex">
                <label className="input input-sm w-56">
                    <i className="fa fa-user me-1"/>
                    <input placeholder={placeholders[watch('searchBy')]} type="text" {...register('criteria')}/>
                </label>
            </div>
            <div className="flex flex-wrap gap-2.5">
                <button className="btn btn-sm btn-outline btn-primary">
                    <i className="fa fa-search"/>
                    Filtrar
                </button>
            </div>
        </form>
    );
};