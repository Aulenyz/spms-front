import {Controller, useForm} from "react-hook-form";
import {useEffect, useState} from "react";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {PeriodSelect} from "../../../components/io/input/business/PeriodSelect.tsx";
import {SpecializationService} from "../../../services/specialization/SpecializationService.ts";
import {Page, Pagination} from "../Page.ts";
import {Specialization} from "../../model/course/Course.ts";
import {Optional, PlainValue, SelectOption} from "../../types/steoreotype.ts";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";

const specializationService = SpecializationService.instance;

const toOption = (s: Specialization): SelectOption => ({value: s.id, description: s.name});

export const CourseFilter = ({onFilter, selectedPeriodId}: {
    onFilter: (filters: Record<string, any>) => void;
    selectedPeriodId: string | number | null;
}) => {
    const {control, setValue, watch} = useForm({
        defaultValues: {
            periodId: selectedPeriodId || "",
            active: true as boolean,
            specializationId: "",
        },
    });

    const [specializations, setSpecializations] = useState<SelectOption[]>([{value: "", description: "Todas"}]);

    const loadSpecializations = (term: string = "") => {
        specializationService
            .search(term, Pagination.of(0, 20))
            .then((page: Page<Specialization>) => setSpecializations([{
                value: "",
                description: "Todas"
            }, ...page.content.map(toOption)]))
            .catch(() => setSpecializations([{value: "", description: "Todas"}]));
    };

    useEffect(() => {
        loadSpecializations();
    }, []);

    useEffect(() => {
        if (selectedPeriodId !== null) setValue("periodId", selectedPeriodId);
    }, [selectedPeriodId, setValue]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            onFilter({
                periodId: watch("periodId"),
                active: watch("active"),
                specializationId: watch("specializationId"),
            });
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("periodId"), watch("active"), watch("specializationId")]);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-52">
                <Controller
                    name="periodId"
                    control={control}
                    render={({field}) => (
                        <PeriodSelect
                            id={selectedPeriodId || ""}
                            text="Selecciona el periodo"
                            {...field}
                            required
                            className="w-full"
                            control={control}
                        />
                    )}
                />
            </div>

            <div className="w-full sm:w-[170px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    value={watch("active") ? "true" : "false"}
                    onSelect={(value) => setValue("active", String(value ?? "true") === "true")}
                    className="w-full"
                    options={[
                        {value: "true", description: "Activos"},
                        {value: "false", description: "Inactivos"},
                    ]}
                />
            </div>

            <div className="w-full sm:w-64">
                <SearchSelect
                    text="Área especializada"
                    hasError={false}
                    value={watch("specializationId")}
                    onSearch={loadSpecializations}
                    onSelect={(value: Optional<PlainValue>) => setValue("specializationId", String(value ?? ""))}
                    className="w-full"
                    options={specializations}
                />
            </div>
        </div>
    );
};
