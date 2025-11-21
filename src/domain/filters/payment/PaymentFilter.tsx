import { PaymentMethod, PaymentMethodLabel, PaymentStatus, PaymentStatusLabel } from "../../model/payment/Payment.ts";
import { PeriodSelect } from "../../../components/io/input/business/PeriodSelect.tsx";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";

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

    const handleFilter = () => {
        const filters = {
            periodId: watch("periodId"),
            status: watch("status"),
            method: watch("method"),
            identifier: watch("identifier"),
        };
        onFilter(filters);
    };

    useEffect(() => {
        if (selectedPeriodId !== null) {
            setValue("periodId", selectedPeriodId);
        }
    }, [selectedPeriodId, setValue]);

    return (
        <div className="flex gap-4 items-center">
            {/* Filtro de Periodo */}
            <div className="flex flex-col items-start gap-2">
                <Controller
                    name="periodId"
                    control={control}
                    render={({ field }) => (
                        <PeriodSelect
                            id={selectedPeriodId || ""}
                            text="Selecciona el Periodo"
                            {...field}
                            required
                            className="w-48"
                            control={control}
                        />
                    )}
                />
            </div>

            {/* Filtro de Estado */}
            <div className="flex flex-col items-start gap-2">
                <select
                    className="select-sm w-32 select bg-transparent"
                    value={watch("status")}
                    onChange={(e) => handleChange("status", e.target.value)}
                >
                    {Object.keys(PaymentStatus).map((statusKey) => {
                        const key = statusKey as keyof typeof PaymentStatus;
                        return (
                            <option key={key} value={PaymentStatus[key]}>
                                {PaymentStatusLabel[PaymentStatus[key]]}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Filtro de Método de Pago */}
            <div className="flex flex-col items-start gap-2">
                <select
                    className="select-sm w-32 select bg-transparent"
                    value={watch("method")}
                    onChange={(e) => handleChange("method", e.target.value)}
                >
                    <option value="" disabled>
                        Método de Pago
                    </option>
                    {Object.keys(PaymentMethod).map((methodKey) => {
                        const key = methodKey as keyof typeof PaymentMethod;
                        return (
                            <option key={key} value={PaymentMethod[key]}>
                                {PaymentMethodLabel[PaymentMethod[key]]}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Filtro de Identificador */}
            <div className="flex flex-col items-start gap-2">
                <input
                    className="input input-sm w-56"
                    type="text"
                    value={watch("identifier")}
                    onChange={(e) => handleChange("identifier", e.target.value)}
                    placeholder="Identificador"
                />
            </div>

            <button type="button" className="btn btn-sm btn-outline btn-primary" onClick={handleFilter}>
                <i className="fa fa-search mr-1" />
                Filtrar
            </button>
        </div>
    );
};
