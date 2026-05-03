import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import logo from "../../../assets/images/logo.png";
import {APP_DESCRIPTOR, APP_FULL_NAME, APP_SHORT_NAME} from "../../../app/config/branding.ts";
import {APPVersion} from "../../../components/io/output/shared/APPVersion.tsx";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import {StorageItem} from "../../../domain/types/StorageItem.ts";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {UserOrganizationService} from "../../../services/user/UserOrganizationService.ts";

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

export const SelectOrganizationPage = () => {
    const [organizations, setOrganizations] = useState<UserOrganizationDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const navigate = useNavigate();
    const {logout}: AuthContextValue = useAuthContext();

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const response = await UserOrganizationService.instance.current();

                if (Array.isArray(response) && response.length > 0) {
                    if (response.length === 1 && response[0].organization) {
                        localStorage.setItem(StorageItem.CompanyRNC, response[0].organization.document);
                        navigate("/", {replace: true});
                        return;
                    }

                    setOrganizations(response);
                    return;
                }

                if (response?.organization) {
                    localStorage.setItem(StorageItem.CompanyRNC, response.organization.document);
                    navigate("/", {replace: true});
                    return;
                }

                toast.warning("No se encontro ningun espacio disponible.");
            } catch {
                toast.error("No se pudieron cargar los espacios.");
            } finally {
                setIsLoading(false);
            }
        };

        loadOrganizations();
    }, [navigate]);

    const handleSelect = (org: UserOrganizationDTO) => {
        if (!org?.organization) {
            return;
        }

        setSelectedId(org.id);
        localStorage.setItem(StorageItem.CompanyRNC, org.organization.document);
        navigate("/", {replace: true});
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
                            <span className="text-xs text-[var(--text-secondary)]">Espacios</span>
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
                                Selecciona el espacio con el que vas a trabajar.
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
                                <div className="auth-space-grid">
                                    {organizations.map((org) => {
                                        const initials = org.organization.name
                                            .split(" ")
                                            .map((word) => word.charAt(0))
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase();

                                        const isSelected = selectedId === org.id;

                                        return (
                                            <button
                                                key={org.organization.id}
                                                type="button"
                                                onClick={() => handleSelect(org)}
                                                className="auth-space-card"
                                            >
                                                <div className="space-y-5">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span
                                                            className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] text-lg font-semibold text-white"
                                                            style={{background: resolveSpaceGradient(org.organization.name)}}
                                                        >
                                                            {initials}
                                                        </span>
                                                        <span
                                                            className="rounded-full px-3 py-1 text-xs font-semibold"
                                                            style={{
                                                                background: isSelected ? "var(--accent-soft)" : "var(--success-soft)",
                                                                color: isSelected ? "var(--accent)" : "var(--success)",
                                                            }}
                                                        >
                                                            {isSelected ? "Entrando" : "Disponible"}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2 text-left">
                                                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                                            {org.organization.name}
                                                        </h2>
                                                        <p className="text-sm leading-6 text-[var(--text-secondary)]">
                                                            Abrir este espacio para continuar al panel.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between border-t pt-4" style={{borderColor: "var(--border-soft)"}}>
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
