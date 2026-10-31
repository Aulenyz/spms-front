import {useForm, useWatch} from "react-hook-form";
import {useEffect, useMemo, useRef} from "react";
import {StudentStatus} from "../../student/Student.ts";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";

const placeholders: Record<string, string> = {
    firstname: 'Ingrese el nombre',
    lastname: 'Ingrese el apellido',
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
        description: 'Graduado',
        value: 'GRADUATED'
    },
    {
        description: 'Retirado',
        value: 'WITHDRAWN'
    },
];

const SearchByOptions: Array<SelectOption> = [
    {
        description: 'Nombre/s',
        value: 'firstname'
    },
    {
        description: 'Apellido/s',
        value: 'lastname'
    },
    {
        description: 'Documento',
        value: 'document'
    }
];

export type StudentFilterFormValue = {
    status: StudentStatus;
    searchBy: string;
    criteria: string;
}

export const StudentFilter = (props: { onFilter: (value: Record<string, string>) => void }) => {

    const {register, control, setValue}: UseForm<StudentFilterFormValue> = useForm<StudentFilterFormValue>({
        defaultValues: {
            status: StudentStatus.ACTIVE,
            searchBy: 'document'
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
        const value: Record<string, string> = {status};
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
                    onSelect={(value) => setValue("status", value as StudentStatus)}
                    className="w-full"
                />
            </div>
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Buscar por"
                    hasError={false}
                    options={SearchByOptions}
                    value={searchBy}
                    onSelect={(value) => setValue("searchBy", String(value ?? "document"))}
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
