import { PaymentMethod, PaymentMethodLabel, PaymentStatus, PaymentStatusLabel } from "../../model/payment/Payment.ts";
import { PeriodSelect } from "../../../components/io/input/business/PeriodSelect.tsx";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

export const PaymentFilter = ({onFilter, selectedPeriodId,}: { onFilter: (filters: Record<string, any>) => void; selectedPeriodId: string | number | null; }) => {
    const { control, setValue, watch } = useForm({
        defaultValues: {
            periodId: selectedPeriodId || "",
            identifier: "",
            status: PaymentStatus.PAID,
            method: "",
        },
    });

    const handleChange = (key: "periodId" | "identifier" | "status" | "method", value: string | number) => {
        setValue(key, value);
    };

    useEffect(() => {
        if (selectedPeriodId !== null) {
            setValue("periodId", selectedPeriodId);
        }
    }, [selectedPeriodId, setValue]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            onFilter({
                periodId: watch("periodId"),
                status: watch("status"),
                method: watch("method"),
                identifier: watch("identifier"),
            });
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [watch("periodId"), watch("status"), watch("method"), watch("identifier")]);

    return (
        <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-full sm:w-48">
                <Controller
                    name="periodId"
                    control={control}
                    render={({ field }) => (
                        <PeriodSelect
                            id={selectedPeriodId || ""}
                            text="Selecciona el Periodo"
                            {...field}
                            required
                            className="w-full"
                            control={control}
                        />
                    )}
                />
            </div>

            <div className="w-full sm:w-[150px]">
                <DropdownSelect
                    text="Estado"
                    hasError={false}
                    value={watch("status")}
                    onSelect={(value) => handleChange("status", String(value ?? PaymentStatus.PAID))}
                    className="w-full"
                    options={Object.keys(PaymentStatus).map((statusKey) => {
                        const key = statusKey as keyof typeof PaymentStatus;
                        return {
                            value: PaymentStatus[key],
                            description: PaymentStatusLabel[PaymentStatus[key]],
                        };
                    })}
                />
            </div>

            <div className="w-full sm:w-[170px]">
                <DropdownSelect
                    text="Metodo"
                    hasError={false}
                    value={watch("method")}
                    onSelect={(value) => handleChange("method", String(value ?? ""))}
                    className="w-full"
                    options={[
                        {value: "", description: "Todos"},
                        ...Object.keys(PaymentMethod).map((methodKey) => {
                            const key = methodKey as keyof typeof PaymentMethod;
                            return {value: PaymentMethod[key], description: PaymentMethodLabel[PaymentMethod[key]]};
                        }),
                    ]}
                />
            </div>

            <div className="w-full sm:w-56">
                <input
                    className="input input-sm w-full"
                    type="text"
                    value={watch("identifier")}
                    onChange={(e) => handleChange("identifier", e.target.value)}
                    placeholder="Identificador"
                />
            </div>
        </div>
    );
};
