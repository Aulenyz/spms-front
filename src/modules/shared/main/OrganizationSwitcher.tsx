import {memo, useCallback, useEffect, useRef, useState} from "react";
import {toast} from "react-toastify";
import {useAuthContext} from "../../../contexts/AuthContext.tsx";
import {useCompany} from "../../../contexts/CompanyContext.tsx";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import {useCurrentOrganization, useMyOrganizations} from "./navbarQueries.ts";
import {initialsOf, resolveLogo, resolveOrganizationHeaderValue} from "./navbarUtils.ts";
import {useDismiss} from "./useDismiss.ts";

const EMPTY: UserOrganizationDTO[] = [];

type OrganizationOptionProps = {
    item: UserOrganizationDTO;
    selected: boolean;
    onSelect: (headerValue: string) => void;
};

const OrganizationOption = memo(({item, selected, onSelect}: OrganizationOptionProps) => {
    const org = item.organization;
    const logo = resolveLogo(org.logo);
    return (
        <button
            type="button"
            onClick={() => {
                if (selected) return;
                onSelect(resolveOrganizationHeaderValue(org));
            }}
            className="rounded-[22px] border p-3 text-left transition"
            style={{
                borderColor: selected ? "var(--accent)" : "var(--border-soft)",
                background: selected ? "color-mix(in srgb, var(--accent-soft) 65%, var(--surface))" : "var(--surface)",
                boxShadow: "var(--shadow-soft)",
            }}
            title={org.name}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[16px] border"
                        style={{
                            borderColor: "var(--border-soft)",
                            background: "var(--surface-muted)"
                        }}
                    >
                        {logo ? (
                            <img
                                src={logo}
                                alt="Logo"
                                className="h-full w-full object-cover"/>
                        ) : (
                            <span className="text-xs font-extrabold"
                                  style={{color: "var(--text-secondary)"}}>
                                {initialsOf(org.name) || "—"}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div
                            className="truncate text-sm font-extrabold"
                            style={{color: "var(--text-primary)"}}>
                            {org.name}
                        </div>
                        <div
                            className="mt-1 truncate text-xs font-semibold"
                            style={{color: "var(--text-tertiary)"}}>
                            {org.document}
                        </div>
                    </div>
                </div>
                <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{
                        background: selected ? "var(--accent-soft)" : "var(--surface-muted)",
                        color: selected ? "var(--accent)" : "var(--text-secondary)",
                    }}
                >
                    {selected ? "Actual" : "Cambiar"}
                </span>
            </div>
        </button>
    );
});

/** Selector del espacio de trabajo (organización) activo. */
export const OrganizationSwitcher = memo(() => {
    const {switchOrganization} = useAuthContext();
    const {rnc, setRnc} = useCompany();
    const {data: organizations = EMPTY, isFetching: orgLoading} = useMyOrganizations();
    const {data: currentOrganization} = useCurrentOrganization();
    const [showOrgMenu, setShowOrgMenu] = useState(false);
    const orgMenuRef = useRef<HTMLDivElement>(null);

    useDismiss(orgMenuRef, useCallback(() => setShowOrgMenu(false), []));

    // Si no hay organización activa y el usuario pertenece a una sola, se selecciona automáticamente.
    useEffect(() => {
        if (!rnc && organizations.length === 1 && organizations[0]?.organization?.id) {
            setRnc(resolveOrganizationHeaderValue(organizations[0].organization));
        }
    }, [organizations, rnc, setRnc]);

    const handleSelect = useCallback((headerValue: string) => {
        switchOrganization(headerValue)
            .then(() => window.location.reload())
            .catch(() => toast.error("No se pudo cambiar el espacio de trabajo."));
    }, [switchOrganization]);

    if (organizations.length === 0) return null;

    const currentOrg = currentOrganization
        ?? organizations.find((o) => resolveOrganizationHeaderValue(o.organization) === rnc)?.organization
        ?? null;
    const currentLogo = resolveLogo(currentOrg?.logo);
    const orgInitials = initialsOf(currentOrg?.name);

    return (
        <div className="relative" ref={orgMenuRef}>
            <button
                type="button"
                onClick={() => {
                    if (organizations.length <= 1) return;
                    setShowOrgMenu((value) => !value);
                }}
                className="inline-flex items-center gap-2 rounded-[18px] border px-2.5 py-1.5 text-left transition"
                style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                title={currentOrg?.name ?? "Espacio de trabajo"}
            >
                <div
                    className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-xl border"
                    style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}
                >
                    {currentLogo ? (
                        <img src={currentLogo} alt="Logo"
                             className="h-full w-full object-cover"/>
                    ) : (
                        <span className="text-[11px] font-extrabold"
                              style={{color: "var(--text-secondary)"}}>
                            {orgInitials || "—"}
                        </span>
                    )}
                </div>
                {organizations.length > 1 && (
                    <i className="fa fa-chevron-down text-[10px] text-[var(--text-tertiary)]"/>
                )}
            </button>

            {organizations.length > 1 && showOrgMenu && (
                <div className="floating-panel left-0 mt-3 w-[340px]">
                    <div className="floating-panel-header">
                        {orgLoading ? "Cargando..." : "Espacios de trabajo"}
                    </div>
                    <div className="p-3">
                        <div className="grid gap-2 max-h-[320px] overflow-auto pr-1">
                            {organizations.map((item) => (
                                <OrganizationOption
                                    key={item.organization.id}
                                    item={item}
                                    selected={resolveOrganizationHeaderValue(item.organization) === rnc}
                                    onSelect={handleSelect}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
