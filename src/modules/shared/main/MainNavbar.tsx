import {useEffect, useMemo, useRef, useState} from "react";
import {isNil} from "lodash";
import {toast} from "react-toastify";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {AuthContextValue, useAuthContext} from "../../../contexts/AuthContext.tsx";
import {LeftModal} from "../../../components/shared/LeftModal.tsx";
import {ChangePasswordForm} from "../../changePassword/changePasswordForm.tsx";
import {useQueryParams} from "../../../hooks/useQueryParams.tsx";
import {UserOrganizationService} from "../../../services/user/UserOrganizationService.ts";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import {useCompany} from "../../../contexts/CompanyContext.tsx";
import {environment} from "../../../environment/environment.ts";
import {joinURLParts} from "../../../utils/URIs.ts";
import {OrganizationService} from "../../../services/organization/OrganizationService.ts";
import {
    OrganizationConfiguration,
    OrganizationConfigurationService
} from "../../../services/configuration/OrganizationConfigurationService.ts";
import {AuthorityKey} from "../../../domain/model/user/authorities.ts";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {PeriodService} from "../../../services/period/PeriodService.ts";
import {Period} from "../../../domain/model/organization/Organization.tsx";
import {DatePicker} from "../../../components/io/DatePicker.tsx";

type MainNavbarProps = {
    subtitle: string;
    onOpenSidebar: () => void;
    breadcrumbs?: Array<{
        label: string;
        onClick?: () => void;
    }>;
};

export const MainNavbar = ({subtitle, onOpenSidebar, breadcrumbs = []}: MainNavbarProps) => {
    const {notification} = useQueryParams();
    const {current, logout, switchOrganization, hasAuthority}: AuthContextValue = useAuthContext();
    const {rnc, setRnc} = useCompany();
    const [organizations, setOrganizations] = useState<UserOrganizationDTO[]>([]);
    const [orgLoading, setOrgLoading] = useState(false);
    const [currentOrganization, setCurrentOrganization] = useState<{
        name?: string;
        logo?: string;
        document?: string
    } | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showOrgMenu, setShowOrgMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState<OrganizationConfiguration[]>([]);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSearch, setSettingsSearch] = useState("");
    const [settingsCategory, setSettingsCategory] = useState<"schoolYear" | "courses">("schoolYear");
    const [generatingSchoolYear, setGeneratingSchoolYear] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
    const [showSchoolYearForm, setShowSchoolYearForm] = useState(false);
    const [schoolYearForm, setSchoolYearForm] = useState({start: "", end: ""});
    const [schoolCalendarReady, setSchoolCalendarReady] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const orgMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSchoolCalendarReady(false);
        if (!rnc || !hasAuthority(AuthorityKey.CONFIGURATION)) return;
        Promise.all([
            OrganizationConfigurationService.instance.list(),
            PeriodService.instance.current().catch(() => null),
        ]).then(([configurationList, period]) => {
            setSettings(configurationList);
            setCurrentPeriod(period);
        }).catch(() => setSettings([])).finally(() => setSchoolCalendarReady(true));
    }, [rnc, hasAuthority]);

    useEffect(() => {
        // Uses OrganizationContext (X-Auth-Company) on backend to return the currently logged organization.
        OrganizationService.instance
            .current()
            .then((org) => setCurrentOrganization(org ?? null))
            .catch(() => setCurrentOrganization(null));
    }, [rnc]);

    useEffect(() => {
        const loadOrganizations = async () => {
            setOrgLoading(true);
            try {
                const res = await UserOrganizationService.instance.current();
                const list = Array.isArray(res) ? res : (res?.organization ? [res] : []);
                setOrganizations(list);
                if (!rnc && list.length === 1 && list[0]?.organization?.id) {
                    setRnc(resolveOrganizationHeaderValue(list[0].organization));
                }
            } catch {
                setOrganizations([]);
            } finally {
                setOrgLoading(false);
            }
        };
        void loadOrganizations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (notification === "show") {
            setShowNotifications(true);
        }
    }, [notification]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
            if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
                setShowOrgMenu(false);
            }
        };

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowProfileMenu(false);
                setShowNotifications(false);
                setShowOrgMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const formatShortDate = (value?: string) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Intl.DateTimeFormat("es", {day: "2-digit", month: "short", year: "numeric"}).format(date);
    };

    const resolveLogo = (value?: string | null) => {
        const raw = (value ?? "").toString().trim();
        if (!raw) return null;
        if (/^data:/i.test(raw)) return raw;
        if (/^https?:\/\//i.test(raw)) return raw;
        // Backend may return relative paths; normalize against api URL.
        return joinURLParts(environment.apiURL, raw.startsWith("/") ? raw : `/${raw}`);
    };

    const resolveOrganizationHeaderValue = (organization?: { id?: string | number } | null) => {
        if (organization?.id === undefined || organization?.id === null) return "";
        return String(organization.id);
    };

    const schoolYearStart = settings.find((configuration) => configuration.name === "SCHOOL_YEAR_START_DATE")?.value;
    const schoolYearEnd = settings.find((configuration) => configuration.name === "SCHOOL_YEAR_END_DATE")?.value;
    const startLabel = formatShortDate(schoolYearStart);
    const endLabel = formatShortDate(currentPeriod?.end);
    const currentOrg = currentOrganization ?? organizations.find((o) => resolveOrganizationHeaderValue(o.organization) === rnc)?.organization ?? null;

    const orgInitials = useMemo(() => {
        const name = (currentOrg?.name ?? "").trim();
        if (!name) return "";
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }, [currentOrg?.name]);

    const openSettings = async () => {
        setShowSettings(true);
        setSettingsLoading(true);
        try {
            setSettings(await OrganizationConfigurationService.instance.list());
        } catch (error) {
            toast.error((error as { message?: string })?.message ?? "No se pudo cargar la configuración.");
        } finally {
            setSettingsLoading(false);
        }
    };

    const updateBooleanSetting = async (configuration: OrganizationConfiguration, checked: boolean) => {
        setSettingsLoading(true);
        try {
            const saved = await OrganizationConfigurationService.instance.save(configuration.name, String(checked));
            setSettings((currentSettings) => currentSettings.map((item) => item.name === saved.name ? saved : item));
            toast.success("Configuración actualizada.");
        } catch (error) {
            toast.error((error as { message?: string })?.message ?? "No se pudo guardar la configuración.");
        } finally {
            setSettingsLoading(false);
        }
    };

    const updateDateSetting = async (configuration: OrganizationConfiguration, value: string) => {
        if (!value || value === configuration.value) return;
        setSettingsLoading(true);
        try {
            const saved = await OrganizationConfigurationService.instance.save(configuration.name, value);
            setSettings((currentSettings) => currentSettings.map((item) => item.name === saved.name ? saved : item));
            toast.success("Fecha del año escolar actualizada.");
        } catch (error) {
            toast.error((error as { message?: string })?.message ?? "No se pudo guardar la fecha.");
        } finally {
            setSettingsLoading(false);
        }
    };

    const automaticSchoolYear = settings.find((configuration) => configuration.name === "AUTO_CREATE_SCHOOL_YEAR")?.value === "true";
    const todayValue = new Date().toLocaleDateString("en-CA");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowValue = tomorrow.toLocaleDateString("en-CA");
    const dayAfter = (value?: string) => {
        if (!value) return tomorrowValue;
        const date = new Date(`${value}T12:00:00`);
        date.setDate(date.getDate() + 1);
        return date.toLocaleDateString("en-CA");
    };
    const addThreeMonths = (value?: string) => {
        if (!value) return tomorrowValue;
        const date = new Date(`${value}T12:00:00`);
        date.setMonth(date.getMonth() + 3);
        const result = date.toLocaleDateString("en-CA");
        return result > tomorrowValue ? result : tomorrowValue;
    };
    const hasActiveSchoolYear = Boolean(currentPeriod?.isActive);
    const nextAvailableSchoolYearStart = currentPeriod?.end ? dayAfter(currentPeriod.end) : tomorrowValue;

    const settingPresentation = (configuration: OrganizationConfiguration) => {
        if (configuration.name === "AUTO_CREATE_SCHOOL_YEAR") {
            return {label: "Generar automáticamente", icon: "fa-rotate", help: "Al llegar la fecha final, crea el siguiente año académico y conserva el mismo rango desplazado un año."};
        }
        if (configuration.name === "SCHOOL_YEAR_START_DATE") {
            return {label: "Inicio del próximo año escolar", icon: "fa-calendar-day", help: "Puedes ajustar esta fecha sin modificar el período que está activo."};
        }
        if (configuration.name === "SCHOOL_YEAR_END_DATE") {
            return {label: "Fin del año escolar", icon: "fa-calendar-check", help: "Marca el cierre del próximo período académico."};
        }
        return {label: "Crear cursos automáticamente", icon: "fa-wand-magic-sparkles", help: "Genera únicamente las secciones faltantes y conserva los cursos existentes."};
    };

    const visibleSettings = settings.filter((configuration) => {
        const belongsToCategory = settingsCategory === "schoolYear"
            ? configuration.dataType === "DATE" || configuration.name === "AUTO_CREATE_SCHOOL_YEAR"
            : configuration.name === "AUTO_CREATE_COURSES";
        const query = settingsSearch.trim().toLowerCase();
        return belongsToCategory && (!query || `${settingPresentation(configuration).label} ${configuration.name} ${configuration.description ?? ""}`.toLowerCase().includes(query));
    }).sort((left, right) => {
        const order = ["AUTO_CREATE_SCHOOL_YEAR", "SCHOOL_YEAR_START_DATE", "SCHOOL_YEAR_END_DATE", "AUTO_CREATE_COURSES"];
        return order.indexOf(left.name) - order.indexOf(right.name);
    });
    const schoolYearSettings = visibleSettings.filter((configuration) =>
        configuration.name === "AUTO_CREATE_SCHOOL_YEAR" || (automaticSchoolYear && configuration.dataType === "DATE"));
    const courseSettings = visibleSettings.filter((configuration) => configuration.name === "AUTO_CREATE_COURSES");

    const openSchoolYearForm = () => {
        setSchoolYearForm({
            start: todayValue,
            end: schoolYearEnd && schoolYearEnd >= addThreeMonths(todayValue)
                ? schoolYearEnd : addThreeMonths(todayValue),
        });
        setShowSchoolYearForm(true);
    };

    const generateSchoolYear = async () => {
        if (!schoolYearForm.start || !schoolYearForm.end) {
            toast.error("Selecciona las fechas de inicio y finalización.");
            return;
        }
        setGeneratingSchoolYear(true);
        try {
            await OrganizationConfigurationService.instance.generateSchoolYear(schoolYearForm.end);
            const [configurationList, period] = await Promise.all([
                OrganizationConfigurationService.instance.list(),
                PeriodService.instance.current(),
            ]);
            setSettings(configurationList);
            setCurrentPeriod(period);
            setShowSchoolYearForm(false);
            toast.success("El año académico fue iniciado correctamente.");
        } catch (error) {
            toast.error((error as { message?: string })?.message ?? "No se pudo generar el año académico.");
        } finally {
            setGeneratingSchoolYear(false);
        }
    };

    const renderSettingRows = (configurations: OrganizationConfiguration[]) => configurations.map((configuration, index) => (
        <div
            key={configuration.name}
            className="flex items-center justify-between gap-6 p-5"
            style={{borderTop: index > 0 ? "1px solid var(--border-soft)" : undefined}}
        >
            <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px]"
                      style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                    <i className={`fa ${settingPresentation(configuration).icon}`}/>
                </span>
                <div>
                    <strong className="block text-sm" style={{color: "var(--text-primary)"}}>{settingPresentation(configuration).label}</strong>
                    <p className="mt-1 max-w-xl text-sm leading-5" style={{color: "var(--text-secondary)"}}>{configuration.description}</p>
                    <p className="mt-2 text-xs" style={{color: "var(--text-tertiary)"}}>{settingPresentation(configuration).help}</p>
                </div>
            </div>
            {configuration.dataType === "BOOLEAN" && (
                <input type="checkbox" className="toggle toggle-primary shrink-0"
                       checked={configuration.value === "true"}
                       disabled={settingsLoading || !hasAuthority(AuthorityKey.CONFIGURATION)}
                       onChange={(event) => void updateBooleanSetting(configuration, event.target.checked)}
                       aria-label={settingPresentation(configuration).label}/>
            )}
            {configuration.dataType === "DATE" && (
                <DatePicker
                    compact
                    value={configuration.value ?? ""}
                    min={configuration.name === "SCHOOL_YEAR_END_DATE" ? addThreeMonths(schoolYearStart) : nextAvailableSchoolYearStart}
                    icon={configuration.name === "SCHOOL_YEAR_END_DATE" ? "fa-calendar-check" : "fa-calendar-day"}
                    disabled={settingsLoading || !hasAuthority(AuthorityKey.CONFIGURATION)
                    }
                    onChange={(value) => void updateDateSetting(configuration, value)}
                />
            )}
        </div>
    ));

    return (
        <>
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
                            {breadcrumbs.length > 0 && (
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
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden lg:flex items-center gap-2">
                            {organizations.length > 0 && (
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
                                            {resolveLogo(currentOrg?.logo) ? (
                                                <img src={resolveLogo(currentOrg?.logo) as string} alt="Logo"
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
                                                    {organizations.map((item) => {
                                                        const org = item.organization;
                                                        const headerValue = resolveOrganizationHeaderValue(org);
                                                        const selected = headerValue === rnc;
                                                        return (
                                                            <button
                                                                key={org.id}
                                                                type="button"
                                                                onClick={async () => {
                                                                    if (selected) return;
                                                                    try {
                                                                        await switchOrganization(headerValue);
                                                                        window.location.reload();
                                                                    } catch {
                                                                        toast.error("No se pudo cambiar el espacio de trabajo.");
                                                                    }
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
                                                                            {resolveLogo(org.logo) ? (
                                                                                <img
                                                                                    src={resolveLogo(org.logo) as string}
                                                                                    alt="Logo"
                                                                                    className="h-full w-full object-cover"/>
                                                                            ) : (
                                                                                <span className="text-xs font-extrabold"
                                                                                      style={{color: "var(--text-secondary)"}}>
                                                                                    {org.name
                                                                                        ?.split(" ")
                                                                                        .map((w) => w.charAt(0))
                                                                                        .slice(0, 2)
                                                                                        .join("")
                                                                                        .toUpperCase() || "—"}
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
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {schoolCalendarReady && (hasActiveSchoolYear || automaticSchoolYear) && <div
                                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                                title="Calendario escolar"
                            >
                                <span>
                                    {hasActiveSchoolYear
                                        ? (endLabel ? `Finaliza ${endLabel}` : "Año académico activo")
                                        : startLabel ? `Inicia ${startLabel}` : "Inicio automático configurado"}
                                </span>
                            </div>}

                            {schoolCalendarReady && !hasActiveSchoolYear && !automaticSchoolYear && hasAuthority(AuthorityKey.CONFIGURATION) && (
                                <button type="button" className="btn btn-sm btn-primary" onClick={openSchoolYearForm}>
                                    <i className="fa fa-calendar-plus me-1"/>Iniciar año escolar
                                </button>
                            )}

                            {hasAuthority(AuthorityKey.CONFIGURATION) && (
                                <button
                                    type="button"
                                    className="icon-button"
                                    title="Configurar año académico"
                                    onClick={() => void openSettings()}
                                >
                                    <i className="fa fa-gear"/>
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowNotifications((currentValue) => !currentValue)}
                                className="icon-button relative"
                                title="Notificaciones"
                            >
                                <i className="fa fa-bell"/>
                                <span className="notification-dot"/>
                            </button>

                            {showNotifications && (
                                <div className="floating-panel right-0 mt-3 w-72">
                                    <div className="floating-panel-header">Notificaciones</div>
                                    <div className="space-y-3 p-3">
                                        <div className="notification-card">
                                            <strong>Cierre de caja</strong>
                                            <p>Dos pagos quedaron pendientes de validacion manual.</p>
                                        </div>
                                        <div className="notification-card">
                                            <strong>Actividad reciente</strong>
                                            <p>Hay movimientos nuevos en inscripciones y pagos del dia.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setShowProfileMenu((currentValue) => !currentValue)}
                                className="profile-button"
                                title="Perfil de usuario"
                            >
                                <LoadingContent loading={isNil(current)}>
                                    <img
                                        src={current?.info.image || "/default-avatar.png"}
                                        alt="Avatar"
                                        className="h-9 w-9 rounded-xl object-cover"
                                    />
                                </LoadingContent>
                                <i className="fa fa-chevron-down text-[10px] text-[var(--text-tertiary)]"/>
                            </button>

                            {showProfileMenu && (
                                <div className="floating-panel right-0 mt-3 w-64">
                                    <div className="space-y-1 p-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowChangePassword(true);
                                                setShowProfileMenu(false);
                                            }}
                                            className="profile-menu-item w-full"
                                        >
                                            <i className="fa fa-key text-[var(--accent)]"/>
                                            <span>Cambiar contrasena</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => logout?.()}
                                            className="profile-menu-item w-full text-[var(--danger)]"
                                        >
                                            <i className="fa fa-sign-out"/>
                                            <span>Cerrar sesion</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <CenterModal
                title="Iniciar año escolar"
                description="Define el rango del nuevo período académico. Debe durar al menos tres meses."
                isOpen={showSchoolYearForm}
                onClose={() => setShowSchoolYearForm(false)}
                className="max-w-lg"
            >
                <form className="space-y-5" onSubmit={(event) => {
                    event.preventDefault();
                    void generateSchoolYear();
                }}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <span className="mb-2 block text-sm font-bold" style={{color: "var(--text-primary)"}}>Fecha de inicio</span>
                            <div className="flex h-12 items-center gap-3 rounded-[15px] border px-3"
                                 style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                                <span className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                                      style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                    <i className="fa fa-calendar-day"/>
                                </span>
                                <strong className="text-sm" style={{color: "var(--text-primary)"}}>{formatShortDate(todayValue)}</strong>
                            </div>
                            <small className="mt-1.5 block px-1 text-xs" style={{color: "var(--text-tertiary)"}}>El período comienza hoy.</small>
                        </div>
                        <DatePicker
                            label="Fecha de finalización"
                            value={schoolYearForm.end}
                            min={addThreeMonths(todayValue)}
                            required
                            icon="fa-calendar-check"
                            helper="Mínimo tres meses después de hoy."
                            onChange={(value) => setSchoolYearForm((currentValue) => ({...currentValue, end: value}))}
                        />
                    </div>
                    <div className="rounded-2xl border p-4 text-sm leading-6" style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)", color: "var(--text-secondary)"}}>
                        <i className="fa fa-circle-info me-2" style={{color: "var(--accent)"}}/>
                        Al iniciar, este período quedará activo y el anterior será cerrado.
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-sm" onClick={() => setShowSchoolYearForm(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-sm btn-primary" disabled={generatingSchoolYear}>
                            <i className={generatingSchoolYear ? "fa fa-spinner fa-spin me-1" : "fa fa-calendar-check me-1"}/>
                            {generatingSchoolYear ? "Iniciando..." : "Iniciar año escolar"}
                        </button>
                    </div>
                </form>
            </CenterModal>

            <CenterModal
                title="Configuración"
                description="Administra el comportamiento del sistema."
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                className="max-w-5xl"
                contentClassName="p-0"
            >
                <div
                    className="grid min-h-[520px] grid-cols-1 md:grid-cols-[245px_1fr]">
                    <aside className="border-b px-3 py-4 md:border-b-0 md:border-r"
                           style={{borderColor: "var(--border-soft)", background: "var(--surface-muted)"}}>
                        <label className="flex h-9 w-full items-center gap-2 rounded-[10px] border px-3"
                               style={{borderColor: "var(--border-soft)", background: "var(--surface)"}}>
                            <i className="fa fa-search text-[11px]" style={{color: "var(--text-tertiary)"}}/>
                            <input
                                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none"
                                value={settingsSearch}
                                onChange={(event) => setSettingsSearch(event.target.value)}
                                placeholder="Buscar ajustes"
                                aria-label="Buscar configuración"
                            />
                        </label>

                        <div className="mt-5">
                            <button type="button" onClick={() => setSettingsCategory("schoolYear")}
                                    className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left"
                                    style={{background: settingsCategory === "schoolYear" ? "var(--accent)" : "transparent", color: settingsCategory === "schoolYear" ? "white" : "var(--text-primary)"}}>
                                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-xs"
                                      style={{background: settingsCategory === "schoolYear" ? "rgba(255,255,255,.2)" : "var(--accent-soft)", color: settingsCategory === "schoolYear" ? "white" : "var(--accent)"}}><i
                                    className="fa fa-calendar-days"/></span>
                                <span>
                                    <strong className="block text-sm">Año académico</strong>
                                </span>
                            </button>
                            <button type="button" onClick={() => setSettingsCategory("courses")}
                                    className="mt-1 flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left"
                                    style={{background: settingsCategory === "courses" ? "var(--accent)" : "transparent", color: settingsCategory === "courses" ? "white" : "var(--text-primary)"}}>
                                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-xs"
                                      style={{background: settingsCategory === "courses" ? "rgba(255,255,255,.2)" : "var(--accent-soft)", color: settingsCategory === "courses" ? "white" : "var(--accent)"}}>
                                    <i className="fa fa-book"/>
                                </span>
                                <strong className="block text-sm">Cursos</strong>
                            </button>
                        </div>

                        <div className="mt-5 border-t px-2 pt-4"
                             style={{borderColor: "var(--border-soft)"}}>
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                                      style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                                    <i className="fa fa-building"/>
                                </span>
                                <div className="min-w-0">
                                    <strong className="block truncate text-xs"
                                            style={{color: "var(--text-primary)"}}>{currentOrg?.name ?? "Organización actual"}</strong>
                                    <span className="block truncate text-[11px]"
                                          style={{color: "var(--text-tertiary)"}}>Configuración independiente</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="p-5 sm:p-7" style={{background: "var(--surface)"}}>
                        <div className="mb-6 flex items-center gap-4">
                            <span
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] text-xl text-white shadow-lg"
                                style={{background: "linear-gradient(145deg, #38bdf8, #2563eb)"}}>
                                <i className={settingsCategory === "schoolYear" ? "fa fa-calendar-days" : "fa fa-book"}/>
                            </span>
                            <div>
                                <h3 className="text-xl font-extrabold"
                                    style={{color: "var(--text-primary)"}}>{settingsCategory === "schoolYear" ? "Año académico" : "Cursos"}</h3>
                                <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>
                                    {settingsCategory === "schoolYear"
                                        ? "Define el inicio y la finalización del próximo período académico."
                                        : "Configura cómo se crean los cursos de cada período."}
                                </p>
                            </div>
                        </div>

                        {settingsLoading && settings.length === 0 ? (
                            <div className="p-8 text-center text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                                <i className="fa fa-spinner fa-spin me-2"/>Cargando configuración...
                            </div>
                        ) : visibleSettings.length === 0 ? (
                            <div className="p-8 text-center text-sm" style={{color: "var(--text-secondary)"}}>No encontramos configuraciones con esa búsqueda.</div>
                        ) : <div className="space-y-7">
                        {schoolYearSettings.length > 0 && <section aria-labelledby="school-year-settings-title">
                            <h4 id="school-year-settings-title"
                                className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.1em]"
                                style={{color: "var(--text-tertiary)"}}>Año escolar</h4>
                            <div className="overflow-hidden rounded-2xl border"
                                 style={{borderColor: "var(--border-soft)"}}>
                                {renderSettingRows(schoolYearSettings)}
                            </div>
                            {automaticSchoolYear && (
                                <p className="mt-3 px-1 text-xs leading-5" style={{color: "var(--text-tertiary)"}}>
                                    El inicio y el fin deben tener al menos tres meses de diferencia.
                                </p>
                            )}
                        </section>}

                        {courseSettings.length > 0 && <section aria-labelledby="course-settings-title">
                            <h4 id="course-settings-title" className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.1em]"
                                style={{color: "var(--text-tertiary)"}}>Cursos</h4>
                            <div className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                                {renderSettingRows(courseSettings)}
                            </div>
                            <p className="mt-3 px-1 text-xs leading-5" style={{color: "var(--text-tertiary)"}}>
                                Si esta opción está desactivada, puedes usar “Agregar cursos” desde los detalles de cada
                                plantilla.
                            </p>
                        </section>}
                        </div>}
                    </main>
                </div>
            </CenterModal>

            <LeftModal
                title="Cambiar contrasena"
                isOpen={showChangePassword}
                onClose={() => setShowChangePassword(false)}
                className="w-[400px] h-full z-[9999]"
            >
                <ChangePasswordForm onSubmit={() => setShowChangePassword(false)}/>
            </LeftModal>
        </>
    );
};
