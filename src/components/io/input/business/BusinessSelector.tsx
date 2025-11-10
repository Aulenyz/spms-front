import {Control, Controller, ControllerRenderProps} from "react-hook-form";
import clsx from "clsx";

export type BusinessSelectParams = {
    name: string,
    inputs: string | undefined,
    control: Control<any>,
    render: ({field}: { field: ControllerRenderProps }) => JSX.Element,
    error: string | undefined
};

export const BusinessSelector = (props: BusinessSelectParams) => {
    return (
        <div className={clsx(props.inputs, "relative")}>
            <Controller name={props.name} control={props.control} render={props.render}/>
            {props.error &&
                (
                    <p className="text-red-500 text-xs absolute right-0 -bottom-4">
                        <i className="fa fa-warning mr-1"/>
                        {props.error}
                    </p>
                )
            }
        </div>
    )
}