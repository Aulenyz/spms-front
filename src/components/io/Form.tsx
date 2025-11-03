import {FormEventHandler, ReactElement} from "react";
import {Optional} from "../../domain/types/steoreotype.ts";

export interface FormParams {
    name: string;
    className: Optional<string>;
    submit: FormEventHandler<HTMLFormElement>;
    children: ReactElement[],
}

export const Form = ({children, name, submit, className}: FormParams) => {
    return (
        <form className={className} onSubmit={submit} id={name} name={name}>
            {children}
        </form>
    );
}