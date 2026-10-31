import {memo, useCallback, useState} from "react";
import {configurationValue, formatShortDate} from "./navbarUtils.ts";
import {useSchoolCalendar} from "./useSchoolCalendar.ts";
import {SchoolYearModal} from "./SchoolYearModal.tsx";
import {SettingsModal} from "./SettingsModal.tsx";

/** Estado del calendario escolar, inicio de año escolar y acceso a la configuración (barra superior). */
export const SchoolCalendarControls = memo(() => {
    const {canConfigure, ready, settings, currentPeriod, automaticSchoolYear, hasActiveSchoolYear} = useSchoolCalendar();
    const [showSettings, setShowSettings] = useState(false);
    const [showSchoolYearForm, setShowSchoolYearForm] = useState(false);
    const closeSettings = useCallback(() => setShowSettings(false), []);
    const closeSchoolYearForm = useCallback(() => setShowSchoolYearForm(false), []);

    const startLabel = formatShortDate(configurationValue(settings, "SCHOOL_YEAR_START_DATE"));
    const endLabel = formatShortDate(currentPeriod?.end);

    return (
        <>
            {ready && (hasActiveSchoolYear || automaticSchoolYear) && <div
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
                title="Calendario escolar"
            >
                <span>
                    {hasActiveSchoolYear
                        ? (endLabel ? `Finaliza ${endLabel}` : "Año académico activo")
                        : startLabel ? `Inicia ${startLabel}` : "Inicio automático configurado"}
                </span>
            </div>}

            {ready && !hasActiveSchoolYear && !automaticSchoolYear && canConfigure && (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowSchoolYearForm(true)}>
                    <i className="fa fa-calendar-plus me-1"/>Iniciar año escolar
                </button>
            )}

            {canConfigure && (
                <button
                    type="button"
                    className="icon-button"
                    title="Configurar año académico"
                    onClick={() => setShowSettings(true)}
                >
                    <i className="fa fa-gear"/>
                </button>
            )}

            {canConfigure && <SchoolYearModal isOpen={showSchoolYearForm} onClose={closeSchoolYearForm}/>}
            {canConfigure && <SettingsModal isOpen={showSettings} onClose={closeSettings}/>}
        </>
    );
});
