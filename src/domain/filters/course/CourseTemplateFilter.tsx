import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {Select, SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {GradeType} from "../../model/course/Course.ts";

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

    const {register, handleSubmit, watch, setValue}: UseForm<CourseTemplateFilterFormValue> = useForm<CourseTemplateFilterFormValue>({
        defaultValues: {
            searchBy: 'name'
        },
        reValidateMode: 'onChange'
    });

    const handleFilter = ({type, searchBy, criteria}: CourseTemplateFilterFormValue) => {
        const filters: Record<string, string> = {type}
        filters[searchBy] = criteria;
        props.onFilter(filters);
    }

    useEffect(() => setValue('criteria', ''), [watch('type'), watch('searchBy')]);

    return (
        <form onSubmit={handleSubmit(handleFilter)} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <Select {...register('type')} className="select-sm w-full" options={useTypeFilter}></Select>
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
