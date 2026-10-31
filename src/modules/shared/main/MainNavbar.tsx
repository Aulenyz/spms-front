import {memo} from "react";
import {OrganizationSwitcher} from "./OrganizationSwitcher.tsx";
import {SchoolCalendarControls} from "./SchoolCalendarControls.tsx";
import {NotificationsMenu} from "./NotificationsMenu.tsx";
import {ProfileMenu} from "./ProfileMenu.tsx";

type Breadcrumb = {
    label: string;
    onClick?: () => void;
};

type MainNavbarProps = {
    subtitle: string;
    onOpenSidebar: () => void;
    breadcrumbs?: Breadcrumb[];
};

const NavbarBreadcrumbs = memo(({breadcrumbs}: { breadcrumbs: Breadcrumb[] }) => (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold">
        {breadcrumbs.map((crumb, index) => {
            const clickable = typeof crumb.onClick === "function";
            return (
                <span key={`${crumb.label}-${index}`}
                      className="inline-flex min-w-0 items-center gap-1.5">
                    {index > 0 && <span className="text-[var(--text-tertiary)]">/</span>}
                    {clickable ? (
                        <button
                            type="button"
                            onClick={crumb.onClick}
                            className="max-w-[220px] truncate text-[var(--accent)] transition hover:opacity-80 hover:underline"
                            title={crumb.label}
                        >
                            {crumb.label}
                        </button>
                    ) : (
                        <span
                            className="max-w-[220px] truncate text-[var(--text-secondary)]"
                            title={crumb.label}>
                            {crumb.label}
                        </span>
                    )}
                </span>
            );
        })}
    </div>
));

/**
 * Barra superior. Cada sección es un componente memoizado con sus propios datos (react-query),
 * de modo que abrir un menú no vuelve a renderizar ni a consultar el resto.
 */
export const MainNavbar = ({subtitle, onOpenSidebar, breadcrumbs = []}: MainNavbarProps) => {
    return (
        <header className="app-topbar">
            <div className="app-topbar-inner">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        className="icon-button lg:hidden"
                        onClick={onOpenSidebar}
                        title="Abrir menu"
                    >
                        <i className="fa fa-bars"/>
                    </button>

                    <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            {subtitle}
                        </p>
                        {breadcrumbs.length > 0 && <NavbarBreadcrumbs breadcrumbs={breadcrumbs}/>}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="hidden lg:flex items-center gap-2">
                        <OrganizationSwitcher/>
                        <SchoolCalendarControls/>
                    </div>

                    <NotificationsMenu/>
                    <ProfileMenu/>
                </div>
            </div>
        </header>
    );
};
