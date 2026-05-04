import {useEffect, useMemo, useRef, useState} from "react";
import React from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import logo from "../../../assets/images/logo.png";
import {APP_DESCRIPTOR, APP_FULL_NAME, APP_SHORT_NAME} from "../../../app/config/branding.ts";
import {APPVersion} from "../../../components/io/output/shared/APPVersion.tsx";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {UserOrganizationService} from "../../../services/user/UserOrganizationService.ts";
import {environment} from "../../../environment/environment.ts";
import {joinURLParts} from "../../../utils/URIs.ts";
import {resolveErrorPath} from "../../errors/resolveErrorPath.ts";

const SPACE_GRADIENTS = [
    "linear-gradient(135deg, #0f62fe, #2563eb)",
    "linear-gradient(135deg, #12805c, #0f766e)",
    "linear-gradient(135deg, #c47b07, #ea580c)",
    "linear-gradient(135deg, #7c3aed, #9333ea)",
];

const resolveSpaceGradient = (name: string) => {
    const hash = name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
    return SPACE_GRADIENTS[hash % SPACE_GRADIENTS.length];
};

const resolveLogo = (value?: string | null) => {
    const raw = (value ?? "").toString().trim();
    if (!raw) return null;
    if (/^data:/i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    return joinURLParts(environment.apiURL, raw.startsWith("/") ? raw : `/${raw}`);
};

export const SelectOrganizationPage = () => {
    const [organizations, setOrganizations] = useState<UserOrganizationDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const navigate = useNavigate();
    const {logout, switchOrganization}: AuthContextValue = useAuthContext();
    const railRef = useRef<HTMLDivElement | null>(null);
    const dragState = useRef<{dragging: boolean; startX: number; startScrollLeft: number} | null>(null);

    const scrollRail = (delta: number) => {
        if (!railRef.current) return;
        railRef.current.scrollBy({left: delta, behavior: "smooth"});
    };

    const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!railRef.current) return;
        dragState.current = {
            dragging: true,
            startX: event.clientX,
            startScrollLeft: railRef.current.scrollLeft,
        };
    };

    const moveDrag = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!railRef.current || !dragState.current?.dragging) return;
        const delta = event.clientX - dragState.current.startX;
        railRef.current.scrollLeft = dragState.current.startScrollLeft - delta;
    };

    const endDrag = () => {
        if (!dragState.current) return;
        dragState.current.dragging = false;
    };

    const spacesLabel = useMemo(() => {
        const total = organizations.length;
        if (!total) return "Espacios";
        return total === 1 ? "1 espacio" : `${total} espacios`;
    }, [organizations.length]);

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const response = await UserOrganizationService.instance.current();

                if (Array.isArray(response) && response.length > 0) {
                    if (response.length === 1 && response[0].organization) {
                        try {
                            await switchOrganization(String(response[0].organization.id));
                            navigate("/", {replace: true});
                        } catch (error) {
                            const errorPath = resolveErrorPath(error as {status?: number});
                            if (errorPath) {
                                navigate(errorPath, {replace: true});
                                return;
                            }
                            toast.error("No se pudo actualizar la sesion del espacio.");
                        }
                        return;
                    }

                    setOrganizations(response);
                    return;
                }

                const single = !Array.isArray(response) ? response : null;
                if (single?.organization) {
                    try {
                        await switchOrganization(String(single.organization.id));
                        navigate("/", {replace: true});
                    } catch (error) {
                        const errorPath = resolveErrorPath(error as {status?: number});
                        if (errorPath) {
                            navigate(errorPath, {replace: true});
                            return;
                        }
                        toast.error("No se pudo actualizar la sesion del espacio.");
                    }
                    return;
                }

                toast.warning("No se encontro ningun espacio disponible.");
            } catch (error) {
                const errorPath = resolveErrorPath(error as {status?: number});
                if (errorPath) {
                    navigate(errorPath, {replace: true});
                    return;
                }
                toast.error("No se pudieron cargar los espacios.");
            } finally {
                setIsLoading(false);
            }
        };

        void loadOrganizations();
    }, [navigate, switchOrganization]);

    const handleSelect = async (org: UserOrganizationDTO) => {
        if (!org?.organization) {
            return;
        }

        setSelectedId(org.id);
        try {
            await switchOrganization(String(org.organization.id));
            navigate("/", {replace: true});
        } catch (error) {
            const errorPath = resolveErrorPath(error as {status?: number});
            if (errorPath) {
                navigate(errorPath, {replace: true});
                return;
            }
            toast.error("No se pudo actualizar la sesion del espacio.");
        }
    };

    if (isLoading) {
        return (
            <div className="auth-screen">
                <div className="auth-shell">
                    <div className="auth-shell-head">
                        <div className="auth-shell-brand">
                            <span className="auth-shell-brand-mark">
                                <img src={logo} alt={APP_SHORT_NAME} className="auth-shell-brand-mark-image"/>
                            </span>
                            <div className="leading-tight">
                                <strong className="block text-sm text-[var(--text-primary)]">{APP_SHORT_NAME}</strong>
                                <span className="text-xs text-[var(--text-secondary)]">Espacios</span>
                            </div>
                        </div>
                    </div>

                    <div className="auth-shell-main">
                        <div className="auth-shell-panel max-w-md text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px]" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                <i className="fa fa-spinner fa-spin text-lg"/>
                            </div>
                            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Cargando espacios</h1>
                            <p className="mt-2 text-sm text-[var(--text-secondary)]">Espera un momento.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-screen">
            <div className="auth-shell">
                <div className="auth-shell-head">
                    <div className="auth-shell-brand">
                        <span className="auth-shell-brand-mark">
                            <img src={logo} alt={APP_SHORT_NAME} className="auth-shell-brand-mark-image"/>
                        </span>
                        <div className="leading-tight">
                            <strong className="block text-sm text-[var(--text-primary)]">{APP_SHORT_NAME}</strong>
                            <span className="text-xs text-[var(--text-secondary)]">Espacios de trabajo</span>
                        </div>
                    </div>
                </div>

                <div className="auth-shell-main">
                    <div className="w-full max-w-[980px] space-y-6">
                        <div className="mx-auto max-w-[560px] text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px]" style={{background: "var(--accent-soft)"}}>
                                <img src={logo} alt="Logo institucional" className="h-8 w-8 object-contain"/>
                            </div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                                {APP_DESCRIPTOR}
                            </p>
                            <h1 className="text-[2rem] font-semibold tracking-tight text-[var(--text-primary)]">
                                {APP_FULL_NAME}
                            </h1>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                Elige el espacio de trabajo con el que vas a trabajar.
                            </p>
                        </div>

                        {organizations.length === 0 ? (
                            <div className="auth-shell-panel mx-auto max-w-md text-center">
                                <h2 className="text-xl font-semibold text-[var(--text-primary)]">No hay espacios disponibles</h2>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">Contacta al administrador para obtener acceso.</p>
                                <div className="mt-5 flex justify-center">
                                    <button type="button" onClick={() => logout?.()} className="btn btn-sm btn-primary">
                                        Cerrar sesion
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mx-auto max-w-[820px] text-center">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                                        {spacesLabel}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-[var(--text-secondary)]">
                                        Desliza hacia los lados o usa las flechas para elegir tu espacio.
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-3">
                                    <button type="button" className="icon-button" title="Anterior" onClick={() => scrollRail(-420)}>
                                        <i className="fa fa-chevron-left"/>
                                    </button>

                                    <div
                                        ref={railRef}
                                        className="flex w-full max-w-[980px] gap-4 overflow-x-auto px-1 pb-2 pt-1"
                                        style={{
                                            scrollSnapType: "x mandatory",
                                            justifyContent: organizations.length <= 2 ? "center" : "flex-start",
                                            cursor: dragState.current?.dragging ? "grabbing" : "grab",
                                            userSelect: "none",
                                        }}
                                        onMouseDown={startDrag}
                                        onMouseMove={moveDrag}
                                        onMouseUp={endDrag}
                                        onMouseLeave={endDrag}
                                    >
                                        {organizations.map((org) => {
                                            const isSelected = selectedId === org.id;
                                            const initials = org.organization.name
                                                .split(" ")
                                                .map((word) => word.charAt(0))
                                                .slice(0, 2)
                                                .join("")
                                                .toUpperCase();

                                            return (
                                                <button
                                                    key={org.organization.id}
                                                    type="button"
                                                    onClick={() => handleSelect(org)}
                                                    className="min-w-[320px] max-w-[320px] flex-shrink-0 rounded-[26px] border p-5 text-left transition"
                                                    style={{
                                                        scrollSnapAlign: "start",
                                                        borderColor: isSelected ? "var(--accent)" : "var(--border-soft)",
                                                        background: "var(--surface)",
                                                        boxShadow: "var(--shadow-card)",
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div
                                                                className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border"
                                                                style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}
                                                            >
                                                                {resolveLogo(org.organization.logo) ? (
                                                                    <img src={resolveLogo(org.organization.logo) as string} alt="Logo" className="h-full w-full object-cover"/>
                                                                ) : (
                                                                    <span
                                                                        className="inline-flex h-full w-full items-center justify-center text-sm font-extrabold text-white"
                                                                        style={{background: resolveSpaceGradient(org.organization.name)}}
                                                                    >
                                                                        {initials}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="truncate text-base font-extrabold text-[var(--text-primary)]">
                                                                    {org.organization.name}
                                                                </div>
                                                                <div className="mt-1 truncate text-xs font-semibold text-[var(--text-tertiary)]">
                                                                    {org.organization.document}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className="rounded-full px-3 py-1 text-[11px] font-semibold"
                                                            style={{
                                                                background: isSelected ? "var(--accent-soft)" : "var(--success-soft)",
                                                                color: isSelected ? "var(--accent)" : "var(--success)",
                                                            }}
                                                        >
                                                            {isSelected ? "Entrando" : "Disponible"}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                                                        Abrir este espacio para continuar al panel.
                                                    </div>

                                                    <div className="mt-5 flex items-center justify-between border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
                                                        <span className="text-xs text-[var(--text-tertiary)]">Acceso listo</span>
                                                        <span className="table-link">
                                                            Entrar
                                                            <i className="fa fa-arrow-right text-2xs"/>
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button type="button" className="icon-button" title="Siguiente" onClick={() => scrollRail(420)}>
                                        <i className="fa fa-chevron-right"/>
                                    </button>
                                </div>

                                <div className="flex justify-center pt-2">
                                    <button type="button" onClick={() => logout?.()} className="btn btn-sm btn-light">
                                        Cerrar sesion
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <APPVersion className="mt-6 text-center text-[var(--text-tertiary)]"/>
            </div>
        </div>
    );
};
