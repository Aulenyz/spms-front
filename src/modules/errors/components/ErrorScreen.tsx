import {ReactNode} from "react";
import {Link} from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import {APP_DESCRIPTOR, APP_SHORT_NAME} from "../../../app/config/branding.ts";

type ErrorAction = {
    label: string;
    to?: string;
    onClick?: () => void;
    variant?: "primary" | "light";
};

type ErrorScreenProps = {
    code: string;
    title: string;
    message: string;
    hint?: string;
    icon: string;
    actions?: ErrorAction[];
    badge?: string;
    children?: ReactNode;
};

export const ErrorScreen = ({
    code,
    title,
    message,
    hint,
    icon,
    actions = [],
    badge = "Centro de ayuda",
    children,
}: ErrorScreenProps) => {
    return (
        <div className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div
                className="w-full max-w-[760px] overflow-hidden rounded-[32px] border"
                style={{
                    borderColor: "var(--border-soft)",
                    background: "linear-gradient(180deg, color-mix(in srgb, var(--surface) 94%, white) 0%, var(--surface) 100%)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                <div
                    className="relative overflow-hidden px-6 py-7 sm:px-8"
                    style={{
                        background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-soft) 78%, white) 0%, color-mix(in srgb, var(--surface-muted) 88%, white) 100%)",
                        borderBottom: "1px solid var(--border-soft)",
                    }}
                >
                    <div className="absolute right-[-28px] top-[-22px] h-28 w-28 rounded-full opacity-40"
                         style={{background: "var(--accent-soft)"}}/>
                    <div className="absolute bottom-[-42px] left-[-10px] h-24 w-24 rounded-full opacity-30"
                         style={{background: "color-mix(in srgb, var(--accent) 14%, transparent)"}}/>

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border bg-white/90 p-3"
                                style={{borderColor: "color-mix(in srgb, var(--accent) 16%, var(--border-soft))"}}
                            >
                                <img src={logo} alt={APP_SHORT_NAME} className="h-full w-full object-contain"/>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                                    {APP_DESCRIPTOR}
                                </p>
                                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2rem]">
                                    {title}
                                </h1>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-semibold"
                             style={{background: "rgba(255,255,255,0.88)", color: "var(--text-secondary)"}}>
                            <span
                                className="inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold"
                                style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                            >
                                {code}
                            </span>
                            <span>{badge}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
                    <div className="rounded-[24px] border p-5"
                         style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                        <div className="flex items-start gap-4">
                            <div
                                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
                                style={{background: "var(--accent-soft)", color: "var(--accent)"}}
                            >
                                <i className={`fa ${icon} text-lg`}/>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {message}
                                </p>
                                {hint && (
                                    <p className="text-sm leading-6 text-[var(--text-secondary)]">
                                        {hint}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {children}

                    {actions.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {actions.map((action) => {
                                const className = `btn btn-sm ${action.variant === "light" ? "btn-light" : "btn-primary"} justify-center`;
                                if (action.to) {
                                    return (
                                        <Link key={`${action.label}-${action.to}`} to={action.to} className={className}>
                                            {action.label}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={action.onClick}
                                        className={className}
                                    >
                                        {action.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
