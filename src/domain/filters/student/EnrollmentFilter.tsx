import {Controller, useForm} from "react-hook-form";
import {useEffect} from "react";
import {Select, SelectOption} from "../../../components/io/output/Select.tsx";
import {PlainValue} from "../../types/steoreotype.ts";
import {PeriodSelect} from "../../../components/io/input/business/PeriodSelect.tsx";

// Opciones para elegir el filtro (Tipo o Periodo)
const searchByOptions: Array<SelectOption> = [
    {
        description: "Tipo",
        value: "status", // Aquí cambiamos "type" por "status"
    },
    {
        description: "Periodo",
        value: "period",
    }
];

// Mapeo de claves del backend
const backendKeys: Record<string, string> = {
    period: "periodId",  // El filtro por periodo se mapea con periodId
    status: "status",    // El filtro por status se mapea con status
};

export type EnrollmentFilterFormValues = {
    searchBy: string;
    criteria: string | number;
    status?: string;  // Añadimos status como un campo opcional
};

export const EnrollmentFilter = (props: { onFilter: (value: Record<string, PlainValue>) => void }) => {
    const {control, handleSubmit, watch, setValue} = useForm<EnrollmentFilterFormValues>({
        defaultValues: {
            searchBy: "status",  // Cambiamos el valor predeterminado a "status"
            criteria: "",
        },
        reValidateMode: "onChange",
    });

    const searchBy = watch("searchBy");

    /** 🔹 Cada vez que cambia el tipo de búsqueda, limpiamos el campo criterio */
    useEffect(() => {
        setValue("criteria", "");
    }, [searchBy, setValue]);

    /** 🔹 Al enviar el filtro */
    const handleFilter = ({searchBy, criteria, status}: EnrollmentFilterFormValues) => {
        const backendKey = backendKeys[searchBy];
        const filters: Record<string, PlainValue> = {};
        if (backendKey && criteria) {
            filters[backendKey] = criteria;  // Asigna el valor correspondiente a la clave del backend
        }
        if (status) {
            filters["status"] = status;  // Si el filtro es por status, se agrega a los filtros
        }
        props.onFilter(filters);  // Pasamos los filtros al componente padre
    };

    return (
        <form onSubmit={handleSubmit(handleFilter)} className="flex flex-wrap gap-2.5 items-center">
            {/* Select para elegir el tipo de filtro (por tipo o por periodo) */}
            <Controller
                name="searchBy"
                control={control}
                render={({field}) => (
                    <Select
                        {...field}
                        className="input input-sm w-44"
                        options={searchByOptions}
                    />
                )}
            />

            {/* Filtro por estado */}
            {searchBy === "status" && (
                <Controller
                    name="status"  // Cambié "type" a "status" porque es el filtro que queremos
                    control={control}
                    render={({field}) => (
                        <Select
                            {...field}
                            className="input input-sm w-48"
                            options={[
                                {description: "Inscrito", value: "ENROLLED"},
                                {description: "Pendiente", value: "PENDING"},
                                {description: "Retirado", value: "WITHDRAWN"},
                            ]}
                        />
                    )}
                />
            )}

            {/* Filtro por periodo */}
            {searchBy === "period" && (
                <Controller
                    name="criteria"
                    control={control}
                    render={({field}) => (
                        <PeriodSelect
                            {...field}
                            control={control}
                            required
                            className="w-48"
                        />
                    )}
                />
            )}

            {/* Botón para aplicar el filtro */}
            <button type="submit" className="btn btn-sm btn-outline btn-primary h-10">
                <i className="fa fa-search mr-1"/>
                Filtrar
            </button>
        </form>
    );
};
