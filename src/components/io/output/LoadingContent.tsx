import {ReactNode} from "react";
import clsx from "clsx";

export const LoadingContent = (props: { children?: ReactNode, loading: boolean, className?: string }) => {
    return (
        props.loading ? (
            <div className={clsx("flex justify-center items-center", props.className)}>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent-soft)] border-t-[var(--accent)]"></div>
            </div>
        ) : props.children
    );
};
