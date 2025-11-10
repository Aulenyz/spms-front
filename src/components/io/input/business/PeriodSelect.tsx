import {toast} from "react-toastify";
import {Optional, PlainValue, SelectOption, State} from "../../../../domain/types/steoreotype.ts";
import {Control, ControllerRenderProps} from "react-hook-form";
import clsx from "clsx";
import {PeriodService} from "../../../../services/period/PeriodService.ts";
import {Page, Pagination} from "../../../../domain/filters/Page.ts";
import {Period, PeriodOptionMapper} from "../../../../domain/model/organization/Organization.tsx";
import {BusinessSelector} from "./BusinessSelector.tsx";
import {SearchSelect} from "../SearchSelect.tsx";
import {forwardRef, useEffect, useState} from "react";

const periodService: PeriodService = PeriodService.instance;

export type PeriodSelectParams = {
    name: string;
    error?: string;
    label?: string;
    required?: boolean;
    value?: PlainValue;
    className?: string;
    labelClassName?: string;
    control: Control<any>;
};

export const PeriodSelect = forwardRef(({name, label, labelClassName, control, ...props}: PeriodSelectParams) => {
    const [options, setOptions]: State<Array<SelectOption>> = useState<Array<SelectOption>>([]);

    const labelClass: string = clsx('form-label text-md mb-1', {
        'text-red-500': Boolean(props.error),
    });

    const handleLoadPeriods = (term: string = '', includeId: boolean = true) => {
        const filters: Record<string, Optional<PlainValue>> = {term};
        filters.id = includeId && props.value ? props.value : undefined;
        periodService.search(filters, Pagination.unsorted()).then((periodPage: Page<Period>) => {
            setOptions(periodPage.content.map(PeriodOptionMapper));
        }, () => toast.error('Problemas cargando los períodos.'));
    };

    useEffect(() => {
        handleLoadPeriods();
    }, []);

    const handleOnSearch = (term: string) => handleLoadPeriods(term, false);

    return (
        <BusinessSelector
            inputs={props.className}
            name={name}
            control={control}
            error={props.error}
            render={({field}: { field: ControllerRenderProps }) => {
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
                            onSearch={handleOnSearch}
                            onSelect={field.onChange}
                            options={options}
                            value={props.value}
                            hasError={Boolean(props.error)}
                        />
                    </>
                );
            }}
        />
    );
});

