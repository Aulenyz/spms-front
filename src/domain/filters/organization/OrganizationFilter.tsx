import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {SelectOption} from "../../../components/io/output/Select.tsx";
import {UseForm} from "../../types/steoreotype.ts";

const searchOptions: SelectOption[] = [
    {description: "Nombre", value: "name"},
    {description: "Documento", value: "document"},
];

const statusOptions: SelectOption[] = [
    {description: "Todos los estados", value: ""},
    {description: "Activas", value: "true"},
    {description: "Inactivas", value: "false"},
];

type OrganizationFilterValues = {active: string; searchBy: "name" | "document"; criteria: string};

export const OrganizationFilter = ({onFilter}: {onFilter: (filters: Record<string, string>) => void}) => {
    const {register, watch, setValue}: UseForm<OrganizationFilterValues> = useForm<OrganizationFilterValues>({defaultValues: {active: "", searchBy: "name", criteria: ""}});
    const active = watch("active");
    const searchBy = watch("searchBy");
    const criteria = watch("criteria");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const filters: Record<string, string> = {};
            if (active) filters.active = active;
            if (criteria.trim()) filters[searchBy] = criteria.trim();
            onFilter(filters);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [active, searchBy, criteria, onFilter]);

    return <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
        <div className="w-full sm:w-[190px]"><DropdownSelect text="Estado" hasError={false} options={statusOptions} value={active} onSelect={(value) => setValue("active", String(value ?? ""))} className="w-full"/></div>
        <div className="w-full sm:w-[140px]"><DropdownSelect text="Buscar por" hasError={false} options={searchOptions} value={searchBy} onSelect={(value) => setValue("searchBy", String(value ?? "name") as OrganizationFilterValues["searchBy"])} className="w-full"/></div>
        <label className="input input-sm w-full sm:w-56"><i className={`fa ${searchBy === "name" ? "fa-building" : "fa-id-card"} me-1`}/><input placeholder={searchBy === "name" ? "Ingrese el nombre" : "Ingrese el documento"} {...register("criteria")}/></label>
    </form>;
};
