import {ReactNode} from 'react';
import clsx from "clsx";

export type TooltipParams = {
    message: string;
    className?: string;
    children: ReactNode;
    placement?: 'top' | 'right' | 'bottom' | 'left';
}

const default_classes: string = 'absolute hidden w-max px-3 py-1 text-sm text-white bg-black rounded-lg group-hover:block';

export const Tooltip = ({children, message, placement, className}: TooltipParams) => {
    return (
        <div className={clsx(className, 'relative group inline-block')}>
            <div className={clsx(default_classes, {
                'bottom-full left-1/2 -translate-x-1/2 mb-2': placement === 'top',
                'top-full left-1/2 -translate-x-1/2 mt-2': placement === 'bottom',
                'left-full top-1/2 -translate-y-1/2 ml-2': placement === 'right',
                'right-full top-1/2 -translate-y-1/2 mr-2': placement === 'left',
            })}>
                {message}
            </div>
            {children}
        </div>
    );
}