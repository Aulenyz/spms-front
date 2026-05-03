import {Controller, useForm} from "react-hook-form";
import {useEffect} from "react";
import {PlainValue} from "../../types/steoreotype.ts";
import {PeriodSelect} from "../../../components/io/input/business/PeriodSelect.tsx";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

const backendKeys: Record<string, string> = {
    period: "periodId",
    status: "status",
};

export type EnrollmentFilterFormValues = {
    searchBy: string;
    criteria: string | number;
    periodId?: string | number;
    status?: string;
};

export const EnrollmentFilter = (props: { onFilter: (value: Record<string, PlainValue>) => void, selectedPeriodId: string | number }) => {
    const {control, watch, setValue} = useForm<EnrollmentFilterFormValues>({
        defaultValues: {
            searchBy: "status",
            periodId: props.selectedPeriodId || "",
            criteria: "",
        },
        reValidateMode: "onChange",
    });

    const searchBy = watch("searchBy");

    useEffect(() => {
        setValue("criteria", "");
    }, [searchBy, setValue]);

    useEffect(() => {
        setValue("periodId", props.selectedPeriodId);
    }, [props.selectedPeriodId, setValue]);

    const handleFilter = ({searchBy, criteria, periodId, status}: EnrollmentFilterFormValues) => {
        const backendKey = backendKeys[searchBy];
        const filters: Record<string, PlainValue> = {};

        if (periodId) {
            filters["periodId"] = periodId;
        }
        if (backendKey && criteria) {
            filters[backendKey] = criteria;
        }
        if (status) {
            filters["status"] = status;
        }
        props.onFilter(filters);
    };

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            handleFilter({
                searchBy: watch("searchBy"),
                criteria: watch("criteria"),
                periodId: watch("periodId"),
                status: watch("status"),
            });
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("searchBy"), watch("criteria"), watch("periodId"), watch("status")]);

    return (
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-48">
                <Controller
                    name="periodId"
                    control={control}
                    render={({field}) => (
                        <PeriodSelect
                            id={props.selectedPeriodId}
                            text="Selecciona el Periodo"
                            {...field}
                            required
                            className="w-full"
                            control={control}
                        />
                    )}
                />
            </div>

            {searchBy === "status" && (
                <div className="w-full sm:w-[150px]">
                    <Controller
                        name="status"
                        control={control}
                        render={({field}) => (
                            <DropdownSelect
                                text="Estado"
                                hasError={false}
                                value={field.value}
                                onSelect={field.onChange}
                                className="w-full"
                                options={[
                                    {description: "Inscrito", value: "ENROLLED"},
                                    {description: "Pendiente", value: "PENDING"},
                                    {description: "Retirado", value: "WITHDRAWN"},
                                ]}
                            />
                        )}
                    />
                </div>
            )}

        </form>
    );
};
