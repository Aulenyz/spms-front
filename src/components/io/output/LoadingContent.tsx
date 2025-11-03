import {ReactNode} from "react";
import clsx from "clsx";

export const LoadingContent = (props: { children?: ReactNode, loading: boolean, className?: string }) => {
    return (
        props.loading ? (
            <div className={clsx("flex justify-center items-center", props.className)}>
                <div className="w-16 h-16 border-4 border-blue-600 border-dotted rounded-full animate-spin"></div>
            </div>
        ) : props.children
    );
};
