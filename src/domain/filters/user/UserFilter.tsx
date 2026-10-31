import {useForm, useWatch} from "react-hook-form";
import {useEffect, useMemo, useRef} from "react";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
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

    const {register, control, setValue}: UseForm<UserFilterFormValue> = useForm<UserFilterFormValue>({
        defaultValues: {
            status: UserStatus.ACTIVE,
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
                    onSelect={(value) => setValue("status", value as UserStatus)}
                    className="w-full"
                />
            </div>
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Buscar por"
                    hasError={false}
                    options={SearchByOptions}
                    value={searchBy}
                    onSelect={(value) => setValue("searchBy", String(value ?? "name"))}
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
