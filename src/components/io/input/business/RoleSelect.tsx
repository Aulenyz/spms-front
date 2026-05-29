import {toast} from "react-toastify";
import {Optional, PlainValue, SelectOption, State} from "../../../../domain/types/steoreotype.ts";
import {Control, ControllerRenderProps} from "react-hook-form";
import clsx from "clsx";
import {Page, Pagination} from "../../../../domain/filters/Page.ts";
import {BusinessSelector} from "./BusinessSelector.tsx";
import {SearchSelect} from "../SearchSelect.tsx";
import {forwardRef, useEffect, useState} from "react";
import {RoleService} from "../../../../services/user/RoleService.ts";
import {UserRole} from "../../../../domain/model/user/user.ts";

const roleService: RoleService = RoleService.instance;

export type RoleSelectParams = {
    text: string;
    name: string;
    error?: string;
    label?: string;
    required?: boolean;
    value?: PlainValue;
    className?: string;
    labelClassName?: string;
    control: Control<any>;
};

export const RoleSelect = forwardRef<HTMLDivElement, RoleSelectParams>(
    ({text, name, label, labelClassName, control, ...props}: RoleSelectParams, ref) => {
        const [options, setOptions]: State<Array<SelectOption>> = useState<Array<SelectOption>>([]);

        const labelClass: string = clsx('form-label text-md mb-1', {
            'text-red-500': Boolean(props.error),
        });

        const handleLoadRoles = (term: string = '') => {
            const filters: Record<string, Optional<PlainValue>> = {term};
            roleService.search(filters, Pagination.unsorted()).then((rolePage: Page<UserRole>) => {
                setOptions(rolePage.content.map(({id: value, name}: UserRole) => ({value, description: name ?? ""})));
            }, () => toast.error('Problemas cargando los roles.'));
        };

        useEffect(() => {
            handleLoadRoles();
        }, []);

        const handleOnSearch = (term: string) => {
            handleLoadRoles(term);
        };

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
                                        {label}*
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
