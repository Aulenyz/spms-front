import ReactDOM from "react-dom";
import {ReactNode, useEffect} from "react";
import clsx from "clsx";

type CenterModalProps = {
    title: string;
    description?: string;
    isOpen: boolean;
    className?: string;
    contentClassName?: string;
    children: ReactNode;
    onClose: VoidFunction;
};

export const CenterModal = ({title, description, isOpen, className, contentClassName, children, onClose}: CenterModalProps) => {
    useEffect(() => {
        if (!isOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", closeOnEscape);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", closeOnEscape);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="center-modal-title"
                className={clsx(
                    "flex max-h-[min(820px,calc(100vh-2rem))] w-full flex-col overflow-hidden rounded-[28px] border shadow-2xl",
                    className,
                )}
                style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}
            >
                <header className="flex items-start justify-between gap-5 border-b px-6 py-5" style={{borderColor: "var(--border-soft)"}}>
                    <div className="min-w-0">
                        <h2 id="center-modal-title" className="text-xl font-extrabold" style={{color: "var(--text-primary)"}}>{title}</h2>
                        {description && <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>{description}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="icon-button shrink-0" title="Cerrar">
                        <i className="fa fa-times"/>
                    </button>
                </header>
                <div className={clsx("overflow-y-auto", contentClassName ?? "p-6")}>{children}</div>
            </section>
        </div>,
        document.body,
    );
};
