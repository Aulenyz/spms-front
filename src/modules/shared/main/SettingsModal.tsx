import {memo, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {useQueryClient} from "@tanstack/react-query";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {DatePicker} from "../../../components/io/DatePicker.tsx";
import {
    OrganizationConfiguration,
    OrganizationConfigurationService
} from "../../../services/configuration/OrganizationConfigurationService.ts";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {addThreeMonths, configurationValue, dayAfter, tomorrowValue} from "./navbarUtils.ts";
import {useSchoolCalendar} from "./useSchoolCalendar.ts";
import {useCurrentOrganization} from "./navbarQueries.ts";

type SettingsCategory = "schoolYear" | "courses" | "billing";

const SETTINGS_ORDER = [
    "AUTO_CREATE_SCHOOL_YEAR", "SCHOOL_YEAR_START_DATE", "SCHOOL_YEAR_END_DATE", "AUTO_CREATE_COURSES",
    "ENROLLMENT_REQUIRES_PAYMENT", "INVOICE_REQUIRES_NCF", "INVOICE_PREFIX",
];
const BILLING_SETTINGS = ["ENROLLMENT_REQUIRES_PAYMENT", "INVOICE_REQUIRES_NCF", "INVOICE_PREFIX"];

const CATEGORIES: {key: SettingsCategory; label: string; icon: string; description: string}[] = [
    {key: "schoolYear", label: "Año académico", icon: "fa-calendar-days", description: "Define el inicio y la finalización del próximo período académico."},
    {key: "courses", label: "Cursos", icon: "fa-book", description: "Configura cómo se crean los cursos de cada período."},
    {key: "billing", label: "Facturación", icon: "fa-file-invoice-dollar", description: "Cómo se cobra la inscripción y cómo se numeran las facturas."},
];

const categoryOf = (name: string): SettingsCategory => {
    if (BILLING_SETTINGS.includes(name)) return "billing";
    if (name === "AUTO_CREATE_COURSES") return "courses";
    return "schoolYear";
};

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
    if (configuration.name === "ENROLLMENT_REQUIRES_PAYMENT") {
        return {label: "La inscripción requiere pago", icon: "fa-user-check", help: "Si está activo, el estudiante queda pendiente hasta pagar la factura de inscripción. Si no, queda inscrito de inmediato y la factura queda por cobrar."};
    }
    if (configuration.name === "INVOICE_REQUIRES_NCF") {
        return {label: "Facturas con comprobante fiscal (NCF)", icon: "fa-receipt", help: "Por ahora las facturas se emiten sin NCF. La integración con la DGII llegará más adelante."};
    }
    if (configuration.name === "INVOICE_PREFIX") {
        return {label: "Prefijo de las facturas", icon: "fa-hashtag", help: "De 1 a 6 letras. Las facturas se numeran así: FAC-000001."};
    }
    return {label: "Crear cursos automáticamente", icon: "fa-wand-magic-sparkles", help: "Genera únicamente las secciones faltantes y conserva los cursos existentes."};
};

type SettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

/** Modal de configuración de la organización (año académico, cursos y facturación). */
export const SettingsModal = memo(({isOpen, onClose}: SettingsModalProps) => {
    const queryClient = useQueryClient();
    const {canConfigure, configurationQuery, settings, currentPeriod, automaticSchoolYear} = useSchoolCalendar();
    const {data: currentOrg} = useCurrentOrganization();
    const [saving, setSaving] = useState(false);
    const [settingsSearch, setSettingsSearch] = useState("");
    const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("schoolYear");
    const [prefixDraft, setPrefixDraft] = useState<string | null>(null);
    const {refetch} = configurationQuery;

    // Al abrir se recarga la configuración (los datos en caché se muestran mientras tanto).
    useEffect(() => {
        if (isOpen) void refetch();
    }, [isOpen, refetch]);

    const settingsLoading = saving || configurationQuery.isFetching;
    const schoolYearStart = configurationValue(settings, "SCHOOL_YEAR_START_DATE");
    const nextAvailableSchoolYearStart = currentPeriod?.end ? dayAfter(currentPeriod.end) : tomorrowValue();

    const saveSetting = async (configuration: OrganizationConfiguration, value: string, successMessage: string, errorMessage: string) => {
        setSaving(true);
        try {
            const saved = await OrganizationConfigurationService.instance.save(configuration.name, value);
            queryClient.setQueriesData<OrganizationConfiguration[]>(
                {queryKey: queryKeys.organizationConfiguration.all},
                (current) => current?.map((item) => item.name === saved.name ? saved : item),
            );
            void queryClient.invalidateQueries({queryKey: queryKeys.organizationConfiguration.all});
            toast.success(successMessage);
        } catch (error) {
            toast.error((error as { message?: string })?.message ?? errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const updateBooleanSetting = (configuration: OrganizationConfiguration, checked: boolean) =>
        saveSetting(configuration, String(checked), "Configuración actualizada.", "No se pudo guardar la configuración.");

    const updateDateSetting = async (configuration: OrganizationConfiguration, value: string) => {
        if (!value || value === configuration.value) return;
        await saveSetting(configuration, value, "Fecha del año escolar actualizada.", "No se pudo guardar la fecha.");
    };

    const updateTextSetting = async (configuration: OrganizationConfiguration, value: string) => {
        setPrefixDraft(null);
        const next = value.trim().toUpperCase();
        if (!next || next === configuration.value) return;
        await saveSetting(configuration, next, "Prefijo de factura actualizado.", "No se pudo guardar el prefijo.");
    };

    const activeCategory = CATEGORIES.find((category) => category.key === settingsCategory) ?? CATEGORIES[0];
    const visibleSettings = settings.filter((configuration) => {
        const belongsToCategory = categoryOf(configuration.name) === settingsCategory;
        const query = settingsSearch.trim().toLowerCase();
        return belongsToCategory && (!query || `${settingPresentation(configuration).label} ${configuration.name} ${configuration.description ?? ""}`.toLowerCase().includes(query));
    }).sort((left, right) => SETTINGS_ORDER.indexOf(left.name) - SETTINGS_ORDER.indexOf(right.name));
    const schoolYearSettings = visibleSettings.filter((configuration) =>
        configuration.name === "AUTO_CREATE_SCHOOL_YEAR" || (automaticSchoolYear && configuration.dataType === "DATE"));
    const courseSettings = visibleSettings.filter((configuration) => configuration.name === "AUTO_CREATE_COURSES");
    const billingSettings = visibleSettings.filter((configuration) => BILLING_SETTINGS.includes(configuration.name));

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
                       disabled={settingsLoading || !canConfigure}
                       onChange={(event) => void updateBooleanSetting(configuration, event.target.checked)}
                       aria-label={settingPresentation(configuration).label}/>
            )}
            {configuration.dataType === "DATE" && (
                <DatePicker
                    compact
                    value={configuration.value ?? ""}
                    min={configuration.name === "SCHOOL_YEAR_END_DATE" ? addThreeMonths(schoolYearStart) : nextAvailableSchoolYearStart}
                    icon={configuration.name === "SCHOOL_YEAR_END_DATE" ? "fa-calendar-check" : "fa-calendar-day"}
                    disabled={settingsLoading || !canConfigure}
                    onChange={(value) => void updateDateSetting(configuration, value)}
                />
            )}
            {configuration.dataType === "TEXT" && (
                <input
                    className="input input-bordered input-sm w-28 shrink-0 text-center font-semibold uppercase"
                    maxLength={6}
                    value={prefixDraft ?? configuration.value ?? ""}
                    disabled={settingsLoading || !canConfigure}
                    onChange={(event) => setPrefixDraft(event.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
                    onBlur={(event) => void updateTextSetting(configuration, event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    aria-label={settingPresentation(configuration).label}
                />
            )}
        </div>
    ));

    return (
        <CenterModal
            title="Configuración"
            description="Administra el comportamiento del sistema."
            isOpen={isOpen}
            onClose={onClose}
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

                    <div className="mt-5 space-y-1">
                        {CATEGORIES.map((category) => {
                            const selected = settingsCategory === category.key;
                            return (
                                <button key={category.key} type="button" onClick={() => setSettingsCategory(category.key)}
                                        className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left"
                                        style={{background: selected ? "var(--accent)" : "transparent", color: selected ? "white" : "var(--text-primary)"}}>
                                    <span className="flex h-7 w-7 items-center justify-center rounded-[9px] text-xs"
                                          style={{background: selected ? "rgba(255,255,255,.2)" : "var(--accent-soft)", color: selected ? "white" : "var(--accent)"}}>
                                        <i className={`fa ${category.icon}`}/>
                                    </span>
                                    <strong className="block text-sm">{category.label}</strong>
                                </button>
                            );
                        })}
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
                            <i className={`fa ${activeCategory.icon}`}/>
                        </span>
                        <div>
                            <h3 className="text-xl font-extrabold"
                                style={{color: "var(--text-primary)"}}>{activeCategory.label}</h3>
                            <p className="mt-1 text-sm" style={{color: "var(--text-secondary)"}}>{activeCategory.description}</p>
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

                        {billingSettings.length > 0 && <section aria-labelledby="billing-settings-title">
                            <h4 id="billing-settings-title" className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.1em]"
                                style={{color: "var(--text-tertiary)"}}>Inscripción y facturas</h4>
                            <div className="overflow-hidden rounded-2xl border" style={{borderColor: "var(--border-soft)"}}>
                                {renderSettingRows(billingSettings)}
                            </div>
                            <p className="mt-3 px-1 text-xs leading-5" style={{color: "var(--text-tertiary)"}}>
                                El precio de la inscripción y la reinscripción se define en Finanzas → Conceptos de pago.
                            </p>
                        </section>}
                    </div>}
                </main>
            </div>
        </CenterModal>
    );
});
