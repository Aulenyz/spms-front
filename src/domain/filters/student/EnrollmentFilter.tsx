import {Controller, useForm, useWatch} from "react-hook-form";
import {useEffect, useMemo, useRef} from "react";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
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
    const {control, setValue} = useForm<EnrollmentFilterFormValues>({
        defaultValues: {
            searchBy: "status",
            periodId: props.selectedPeriodId || "",
            criteria: "",
        },
        reValidateMode: "onChange",
    });

    const [searchBy, criteria, periodId, status] = useWatch({control, name: ["searchBy", "criteria", "periodId", "status"]});

    // Al cambiar el campo de búsqueda se limpia el criterio (no en el montaje).
    const mounted = useRef(false);
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        setValue("criteria", "");
    }, [searchBy, setValue]);

    useEffect(() => {
        setValue("periodId", props.selectedPeriodId);
    }, [props.selectedPeriodId, setValue]);

    const filters = useMemo(() => {
        const backendKey = backendKeys[searchBy];
        const value: Record<string, PlainValue> = {};

        if (periodId) {
            value["periodId"] = periodId;
        }
        if (backendKey && criteria) {
            value[backendKey] = criteria;
        }
        if (status) {
            value["status"] = status;
        }
        return value;
    }, [searchBy, criteria, periodId, status]);

    useFilterEmitter(filters, props.onFilter);


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
