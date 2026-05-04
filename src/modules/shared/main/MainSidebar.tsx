import {useMemo, useState} from "react";
import clsx from "clsx";
import {NavLink, useLocation} from "react-router-dom";
import {toast} from "react-toastify";
import logo from "../../../assets/images/logo.png";
import {navigationSections, secondaryQuickLinks} from "../../../app/navigation/menu.ts";
import {APP_DESCRIPTOR, APP_SHORT_NAME} from "../../../app/config/branding.ts";
import {CommercialCollectionModal} from "../../student/enrollment/modal/EnrollmentInscriptionModal.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";

type MainSidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    onCloseMobile: () => void;
    onToggleCollapse: () => void;
};

export const MainSidebar = ({
                                collapsed,
                                mobileOpen,
                                onCloseMobile,
                            }: MainSidebarProps) => {
    const location = useLocation();
    const {current}: AuthContextValue = useAuthContext();
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [query, setQuery] = useState("");
    const [openSections, setOpenSections] = useState<string[]>([
        navigationSections[0]?.title ?? "",
        navigationSections[1]?.title ?? "",
    ]);

    const filteredSections = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return navigationSections;
        }

        return navigationSections
            .map((section) => ({
                ...section,
                items: section.items.filter((item) => item.label.toLowerCase().includes(normalizedQuery)),
            }))
            .filter((section) => section.items.length > 0);
    }, [query]);

    const toggleSection = (title: string) => {
        setOpenSections((currentSections) => (
            currentSections.includes(title)
                ? currentSections.filter((sectionTitle) => sectionTitle !== title)
                : [...currentSections, title]
        ));
    };

    const handleQuickAction = (action?: string) => {
        if (action === "collection") {
            setShowCollectionModal(true);
            onCloseMobile();
            return;
        }

        toast.info("Disponible en una siguiente iteracion.");
    };

    return (
        <>
            <div
                className={clsx("app-sidebar-backdrop", {"app-sidebar-backdrop-visible": mobileOpen})}
                onClick={onCloseMobile}
            />

            <aside className={clsx("app-sidebar", {
                "app-sidebar-open": mobileOpen,
                "app-sidebar-collapsed": collapsed,
            })}>
                <div className={clsx("app-sidebar-panel", {"app-sidebar-collapsed": collapsed})}>

                    <div className="app-sidebar-header">
                        <NavLink to="/home" className="app-brand" onClick={onCloseMobile}>
                            <span className="app-brand-mark">
                                <img src={logo} alt={APP_SHORT_NAME} className="app-brand-mark-image"/>
                            </span>
                            {!collapsed && (
                                <span className="app-brand-copy">
                                    <strong>{APP_SHORT_NAME}</strong>
                                    <small>{APP_DESCRIPTOR}</small>
                                </span>
                            )}
                        </NavLink>
                    </div>

                    <div className="app-sidebar-body">
                        {!collapsed && (
                            <div className="sidebar-search-wrap">
                                <i className="fa fa-search sidebar-search-icon"/>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Buscar modulo"
                                    className="sidebar-search-input"
                                />
                            </div>
                        )}

                        {filteredSections.map((section) => {
                            const isOpen = query ? true : openSections.includes(section.title);
                            const hasActiveItem = section.items.some((item) => (
                                item.to ? location.pathname.startsWith(item.to.replace("/list", "")) : false
                            ));

                            return (
                                <section key={section.title} className="sidebar-section sidebar-accordion">
                                    {!collapsed && (
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.title)}
                                            className={clsx("sidebar-accordion-trigger", {
                                                "sidebar-accordion-trigger-active": hasActiveItem,
                                            })}
                                        >
                                            <span>{section.title}</span>
                                            <i className={`fa ${isOpen ? "fa-chevron-up" : "fa-chevron-down"} text-[10px]`}/>
                                        </button>
                                    )}

                                    {(collapsed || isOpen) && (
                                        <div className="space-y-1.5">
                                            {section.items.map((item) => (
                                                item.to ? (
                                                    <NavLink
                                                        key={item.label}
                                                        to={item.to}
                                                        onClick={onCloseMobile}
                                                        aria-label={item.label}
                                                        title={collapsed ? item.label : undefined}
                                                        className={({isActive}) => clsx("sidebar-nav-item", {
                                                            "sidebar-nav-item-active": isActive,
                                                            "sidebar-nav-item-collapsed": collapsed,
                                                        })}
                                                    >
                                                        <span className="sidebar-nav-icon">
                                                            <i className={`fa ${item.icon}`}/>
                                                        </span>
                                                        {collapsed && (
                                                            <span
                                                                className="sidebar-collapsed-tooltip">{item.label}</span>
                                                        )}
                                                        {!collapsed && (
                                                            <span className="min-w-0">
                                                                <span className="sidebar-nav-label-row">
                                                                    <span
                                                                        className="sidebar-nav-label">{item.label}</span>
                                                                    {item.badge && <span
                                                                        className="sidebar-badge">{item.badge}</span>}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </NavLink>
                                                ) : (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        onClick={() => handleQuickAction(item.action)}
                                                        aria-label={item.label}
                                                        title={collapsed ? item.label : undefined}
                                                        className={clsx("sidebar-nav-item w-full text-left", {
                                                            "sidebar-nav-item-collapsed": collapsed,
                                                        })}
                                                    >
                                                        <span className="sidebar-nav-icon">
                                                            <i className={`fa ${item.icon}`}/>
                                                        </span>
                                                        {collapsed && (
                                                            <span
                                                                className="sidebar-collapsed-tooltip">{item.label}</span>
                                                        )}
                                                        {!collapsed && (
                                                            <span className="min-w-0">
                                                                <span className="sidebar-nav-label-row">
                                                                    <span
                                                                        className="sidebar-nav-label">{item.label}</span>
                                                                    {item.badge && <span
                                                                        className="sidebar-badge">{item.badge}</span>}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}

                        {!collapsed && (
                            <section className="sidebar-promo">
                                <span className="sidebar-section-title">Accesos</span>
                                <div className="grid gap-1.5">
                                    {secondaryQuickLinks.map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => handleQuickAction()}
                                            className="sidebar-quick-link"
                                        >
                                            <span className="sidebar-nav-icon">
                                                <i className={`fa ${item.icon}`}/>
                                            </span>
                                            <span className="sidebar-nav-label-row">
                                                <span className="sidebar-nav-label">{item.label}</span>
                                                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="app-sidebar-footer">
                        <div className="app-user-card">
                            <img
                                src={current?.info.image || "/default-avatar.png"}
                                alt="Avatar"
                                className="h-11 w-11 rounded-2xl object-cover"
                            />
                            {!collapsed && (
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                        {current?.info.firstname} {current?.info.lastname}
                                    </p>
                                    <p className="truncate text-xs text-[var(--text-secondary)]">
                                        {current?.email ?? current?.username}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            <CommercialCollectionModal isOpen={showCollectionModal} onClose={() => setShowCollectionModal(false)}/>
        </>
    );
};

export default MainSidebar;
