import ReactDOM from "react-dom";
import clsx from "clsx";
import {Tooltip} from "./Tooltip";
import {ReactNode, useEffect, useLayoutEffect, useState} from "react";

export type LeftModalParams = {
    title: string;
    isOpen: boolean;
    backdrop?: boolean;
    className?: string;
    children: ReactNode;
    onClose: VoidFunction;
};

const baseClasses = "fixed top-0 left-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out";

export const LeftModal = ({title, isOpen, backdrop = true, className, children, onClose}: LeftModalParams) => {
    const [mounted, setMounted] = useState(false);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
        } else {
            setShow(false);
            const timeout = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);
    useLayoutEffect(() => {
        if (mounted) {
            requestAnimationFrame(() => setShow(true));
        }
    }, [mounted]);

    if (!mounted) return null;

    return ReactDOM.createPortal(
        <>
            {backdrop && (
                <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"/>
            )}
            <div
                className={clsx(
                    baseClasses, 'z-[9999]', className, {'translate-x-0': show, '-translate-x-full': !show}, className
                )}>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <Tooltip placement="bottom" message="Cerrar">
                            <button
                                onClick={onClose}
                                title="Cerrar"
                                className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300">
                                <i className="fa fa-times text-gray-600"/>
                            </button>
                        </Tooltip>
                    </div>
                    {children}
                </div>
            </div>
        </>,
        document.body
    );
};
