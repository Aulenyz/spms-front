import {useForm} from "react-hook-form";
import {useEffect} from "react";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";
import {GradeType} from "../../model/course/Course.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

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

    const {register, watch, setValue}: UseForm<CourseTemplateFilterFormValue> = useForm<CourseTemplateFilterFormValue>({
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

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            handleFilter({
                type: watch("type"),
                searchBy: watch("searchBy"),
                criteria: watch("criteria") ?? "",
            });
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("type"), watch("searchBy"), watch("criteria")]);

    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-[140px]">
                <DropdownSelect
                    text="Tipo"
                    hasError={false}
                    options={useTypeFilter}
                    value={watch("type")}
                    onSelect={(value) => setValue("type", value as GradeType)}
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
