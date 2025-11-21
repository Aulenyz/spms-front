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
        const [options, setOptions]: State<Array<SelectOption>> = useState<Array<SelectOption>>([]);

        const labelClass: string = clsx('form-label text-md mb-1', {
            'text-red-500': Boolean(props.error),
        });

        const handleLoadPeriods = (term: string = '') => {
            const filters: Record<string, Optional<PlainValue>> = { term };
            filters.id = id;
            periodService.search(filters, Pagination.unsorted()).then((periodPage: Page<Period>) => {
                setOptions(periodPage.content.map(PeriodOptionMapper));
            }, () => toast.error('Problemas cargando los períodos.'));
        };

        useEffect(() => {
            handleLoadPeriods();
        }, []);

        const handleOnSearch = (term: string) => {
            handleLoadPeriods(term);
        };

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
                                className="select-sm w-32 select bg-transparent"
                                ref={ref as any}
                            />
                        </>
                    );
                }}
            />
        );
    });
