import {useForm, useWatch} from "react-hook-form";
import {useEffect, useMemo, useRef} from "react";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {GradeType} from "../../model/course/Course.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";

const placeholders: Record<string, string> = {
    name: 'Ingrese el nombre',
}

const useTypeFilter: Array<SelectOption> = [
    {
        description: 'Primaria',
        value: 'PRIMARY'
    },
    {
        description: 'Secondary',
        value: 'SECONDARY'
    },
    {
        description: 'Tecnico',
        value: 'TECHNICAL'
    }
];

export type CourseTemplateFilterFormValue = {
    type: GradeType;
    searchBy: string;
    criteria: string;
}

export const CourseTemplateFilter = (props: { onFilter: (value: Record<string, string>) => void }) => {

    const {register, control, setValue}: UseForm<CourseTemplateFilterFormValue> = useForm<CourseTemplateFilterFormValue>({
        defaultValues: {
            searchBy: 'name'
        },
        reValidateMode: 'onChange'
    });
    const [type, searchBy, criteria] = useWatch({control, name: ['type', 'searchBy', 'criteria']});

    // Al cambiar tipo o campo de búsqueda se limpia el criterio (no en el montaje).
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        setValue('criteria', '');
    }, [type, searchBy, setValue]);

    // Valor inicial = filtros iniciales de la página ({name: "", type: ""}).
    const filters = useMemo(() => {
        const value: Record<string, string> = {type: type ?? ""};
        value[searchBy] = criteria ?? "";
        return value;
    }, [type, searchBy, criteria]);

    useFilterEmitter(filters, props.onFilter);

    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Tipo"
                    hasError={false}
                    options={useTypeFilter}
                    value={type}
                    onSelect={(value) => setValue("type", value as GradeType)}
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
