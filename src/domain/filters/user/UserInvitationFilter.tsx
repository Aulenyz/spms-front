import {useForm, useWatch} from "react-hook-form";
import {useEffect, useMemo, useRef} from "react";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
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
        control,
        setValue
    }: UseForm<UserInvitationFilterFormValue> = useForm<UserInvitationFilterFormValue>({
        defaultValues: {
            searchBy: 'name'
        },
        reValidateMode: 'onChange'
    });

    const [status, searchBy, criteria] = useWatch({control, name: ['status', 'searchBy', 'criteria']});

    // Al cambiar estado o campo de búsqueda se limpia el criterio (no en el montaje).
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        setValue('criteria', '');
    }, [status, searchBy, setValue]);

    const filters = useMemo(() => {
        const value: Record<string, string> = {};
        if (status) value.status = status;
        // Criterio vacío no se envía: equivale al filtro inicial de la página.
        if (criteria) value[searchBy] = criteria;
        return value;
    }, [status, searchBy, criteria]);

    useFilterEmitter(filters, props.onFilter);


    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    options={useStatusFilter}
                    value={status}
                    onSelect={(value) => setValue("status", value as InvitationStatus)}
                    className="w-full"
                />
            </div>
            <label className="input input-sm w-full sm:w-56">
                <i className="fa fa-user me-1"/>
                <input placeholder={placeholders[searchBy]} type="text" {...register('criteria')}/>
            </label>
        </form>
    );
};
