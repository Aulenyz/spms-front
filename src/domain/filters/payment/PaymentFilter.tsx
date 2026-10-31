import { PaymentMethod, PaymentMethodLabel, PaymentStatus, PaymentStatusLabel } from "../../model/payment/Payment.ts";
import { PeriodSelect } from "../../../components/io/input/business/PeriodSelect.tsx";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import {useFilterEmitter} from "../../../hooks/useFilterEmitter.ts";
import {DropdownSelect} from "../../../components/io/input/DropdownSelect.tsx";

export const PaymentFilter = ({onFilter, selectedPeriodId,}: { onFilter: (filters: Record<string, any>) => void; selectedPeriodId: string | number | null; }) => {
    const { control, setValue } = useForm({
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

    const [periodId, status, method, identifier] = useWatch({control, name: ["periodId", "status", "method", "identifier"]});

    // Valores vacíos (método "Todos", identificador vacío) no se envían.
    const filters = useMemo(() => {
        const value: Record<string, string | number> = {periodId, status};
        if (method) value.method = method;
        if (identifier) value.identifier = identifier;
        return value;
    }, [periodId, status, method, identifier]);

    useFilterEmitter(filters, onFilter);

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
                    value={status}
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
                    value={method}
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
                    value={identifier}
                    onChange={(e) => handleChange("identifier", e.target.value)}
                    placeholder="Identificador"
                />
            </div>
        </div>
    );
};
