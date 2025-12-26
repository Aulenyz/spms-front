import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {Select, SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {InvitationStatus} from "../../model/user/user.ts";

const placeholders: Record<string, string> = {
    name: 'Ingrese el correo',
}

const useStatusFilter: Array<SelectOption> = [
    {
        description: 'Todos',
        value: ''
    },
    {
        description: 'Aceptada',
        value: 'ACCEPTED'
    },
    {
        description: 'Pendiente',
        value: 'PENDING'
    },
    {
        description: 'Cancelada',
        value: 'CANCELLED'
    }
];

export type UserInvitationFilterFormValue = {
    status: InvitationStatus;
    searchBy: string;
    criteria: string;
}

export const UserInvitationFilter = (props: { onFilter: (value: Record<string, string>) => void }) => {

    const {
        register,
        handleSubmit,
        watch,
        setValue
    }: UseForm<UserInvitationFilterFormValue> = useForm<UserInvitationFilterFormValue>({
        defaultValues: {
            searchBy: 'name'
        },
        reValidateMode: 'onChange'
    });

    const handleFilter = ({status, searchBy, criteria}: UserInvitationFilterFormValue) => {
        const filters: Record<string, string> = {status}
        filters[searchBy] = criteria;
        props.onFilter(filters);
    }

    useEffect(() => setValue('criteria', ''), [watch('status'), watch('searchBy')]);

    return (
        <form onSubmit={handleSubmit(handleFilter)} className="flex flex-wrap gap-2.5">
            <div className="flex">
                <Select {...register('status')} className="select-sm w-32 mr-2" options={useStatusFilter}></Select>
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