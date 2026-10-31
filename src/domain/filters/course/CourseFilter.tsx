import {Controller, useForm, useWatch} from "react-hook-form";
import {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";
import {PeriodSelect} from "../../../components/io/input/business/PeriodSelect.tsx";
import {SpecializationService} from "../../../services/specialization/SpecializationService.ts";
import {Page, Pagination} from "../Page.ts";
import {Specialization} from "../../model/course/Course.ts";
import {Optional, PlainValue, SelectOption} from "../../types/steoreotype.ts";
import {SearchSelect} from "../../../components/io/input/SearchSelect.tsx";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";

const specializationService = SpecializationService.instance;

const toOption = (s: Specialization): SelectOption => ({value: s.id, description: s.name});

export const CourseFilter = ({onFilter, selectedPeriodId}: {
    onFilter: (filters: Record<string, any>) => void;
    selectedPeriodId: string | number | null;
}) => {
    const {control, register, setValue} = useForm({
        defaultValues: {
            periodId: selectedPeriodId || "",
            active: true as boolean,
            specializationId: "",
            name: "",
        },
    });

    const [specializationTerm, setSpecializationTerm] = useState("");
    const {data: specializationPage} = useQuery({
        queryKey: [...queryKeys.specializations.all, "search", specializationTerm],
        queryFn: ({signal}) => specializationService.withSignal(signal).search(specializationTerm, Pagination.of(0, 20)),
        meta: {silent: true},
    });
    const specializations: SelectOption[] = useMemo(() => [
        {value: "", description: "Todas"},
        ...((specializationPage as Page<Specialization> | undefined)?.content ?? []).map(toOption),
    ], [specializationPage]);

    useEffect(() => {
        if (selectedPeriodId !== null) setValue("periodId", selectedPeriodId);
    }, [selectedPeriodId, setValue]);

    const [periodId, active, specializationId, name] = useWatch({control, name: ["periodId", "active", "specializationId", "name"]});

    const filters = useMemo(() => ({periodId, active, specializationId, name}), [periodId, active, specializationId, name]);
    useFilterEmitter(filters, onFilter);

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
                    value={active ? "true" : "false"}
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
                    value={specializationId}
                    onSearch={setSpecializationTerm}
                    onSelect={(value: Optional<PlainValue>) => setValue("specializationId", String(value ?? ""))}
                    className="w-full"
                    options={specializations}
                />
            </div>

            <label className="input input-sm w-full sm:w-56">
                <i className="fa fa-search me-1"/>
                <input placeholder="Buscar por nombre" type="text" {...register("name")}/>
            </label>
        </div>
    );
};
