import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {InvitationStatus} from "../../model/user/user.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

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
                    onSelect={(value) => setValue("status", value as InvitationStatus)}
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
