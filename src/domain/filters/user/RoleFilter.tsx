import {useForm, useWatch} from "react-hook-form";
import {useEffect, useRef} from "react";
import {UseForm} from "../../types/steoreotype.ts";

const placeholders: Record<string, string> = {
    name: 'Ingrese el nombre',
}

export type UserFilterFormValue = {
    searchBy: string;
    criteria: string;
}

export const RoleFilter = (props: { onFilter: (value: Record<string, string>) => void }) => {

    const {register, handleSubmit, control, setValue}: UseForm<UserFilterFormValue> = useForm<UserFilterFormValue>({
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

    const searchBy = useWatch({control, name: 'searchBy'});

    // Al cambiar el campo de búsqueda se limpia el criterio (no en el montaje).
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        setValue('criteria', '');
    }, [searchBy, setValue]);

    return (
        <form onSubmit={handleSubmit(handleFilter)} className="flex flex-wrap items-end gap-2.5">
            <label className="input input-sm w-full sm:w-56">
                <i className="fa fa-user me-1"/>
                <input placeholder={placeholders[searchBy]} type="text" {...register('criteria')}/>
            </label>
            <button className="btn btn-sm btn-outline btn-primary">
                <i className="fa fa-search"/>
                Filtrar
            </button>
        </form>
    );
};
