import {useQuery} from "@tanstack/react-query";
import {Optional, PlainValue, SelectOption, State} from "../../../../domain/types/steoreotype.ts";
import {Control, ControllerRenderProps} from "react-hook-form";
import clsx from "clsx";
import {PeriodService} from "../../../../services/period/PeriodService.ts";
import {Pagination} from "../../../../domain/filters/Page.ts";
import {PeriodOptionMapper} from "../../../../domain/model/organization/Organization.tsx";
import {BusinessSelector} from "./BusinessSelector.tsx";
import {SearchSelect} from "../SearchSelect.tsx";
import {forwardRef, useState} from "react";
import {queryKeys} from "../../../../app/query/queryKeys.ts";

const periodService: PeriodService = PeriodService.instance;
const EMPTY_OPTIONS: Array<SelectOption> = [];

export type PeriodSelectParams = {
    text: string;
    name: string;
    error?: string;
    label?: string;
    required?: boolean;
    value?: PlainValue;
    className?: string;
    labelClassName?: string;
    control: Control<any>;
    id?: string | number;
};

export const PeriodSelect = forwardRef<HTMLDivElement, PeriodSelectParams>(
    ({ text, name, label, labelClassName, control, id, ...props }: PeriodSelectParams, ref) => {
        const [term, setTerm]: State<string> = useState<string>('');

        const labelClass: string = clsx('form-label text-md mb-1', {
            'text-red-500': Boolean(props.error),
        });

        // Opciones en caché por término de búsqueda (SearchSelect ya aplica debounce a onSearch).
        const filters: Record<string, Optional<PlainValue>> = {term, id};
        const {data: options = EMPTY_OPTIONS} = useQuery({
            queryKey: queryKeys.period.search(filters),
            queryFn: ({signal}) => periodService.withSignal(signal).search(filters, Pagination.unsorted()),
            select: (periodPage) => periodPage.content.map(PeriodOptionMapper) as Array<SelectOption>,
            meta: {errorMessage: 'Problemas cargando los períodos.'},
        });

        const handleOnSearch = (value: string) => setTerm(value);

        return (
            <BusinessSelector
                inputs={props.className}
                name={name}
                control={control}
                error={props.error}
                render={({ field }: { field: ControllerRenderProps }) => {
                    return (
                        <>
                            {label && (
                                <div className="relative w-fit">
                                    <label htmlFor={name} className={labelClass}>
                                        {label}
                                        {props.required && <small className="text-4xs absolute -right-2">
                                            <i className="fa fa-asterisk"/>
                                        </small>}
                                    </label>
                                </div>
                            )}
                            <SearchSelect
                                text={text}
                                onSearch={handleOnSearch}
                                onSelect={field.onChange}
                                options={options}
                                value={field.value}
                                hasError={Boolean(props.error)}
                                className="select-sm w-full"
                                ref={ref as any}
                            />
                        </>
                    );
                }}
            />
        );
    });
