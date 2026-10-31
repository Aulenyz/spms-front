import {memo, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {useQueryClient} from "@tanstack/react-query";
import {CenterModal} from "../../../components/shared/CenterModal.tsx";
import {DatePicker} from "../../../components/io/DatePicker.tsx";
import {OrganizationConfigurationService} from "../../../services/configuration/OrganizationConfigurationService.ts";
import {queryKeys} from "../../../app/query/queryKeys.ts";
import {addThreeMonths, configurationValue, formatShortDate, todayValue} from "./navbarUtils.ts";
import {useSchoolCalendar} from "./useSchoolCalendar.ts";

type SchoolYearModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

/** Formulario para iniciar (generar) un nuevo año escolar. */
export const SchoolYearModal = memo(({isOpen, onClose}: SchoolYearModalProps) => {
    const queryClient = useQueryClient();
    const {settings} = useSchoolCalendar();
    const [schoolYearForm, setSchoolYearForm] = useState({start: "", end: ""});
    const [generatingSchoolYear, setGeneratingSchoolYear] = useState(false);
    const today = todayValue();
    const schoolYearEnd = configurationValue(settings, "SCHOOL_YEAR_END_DATE");

    // Valores iniciales al abrir el formulario.
    useEffect(() => {
        if (!isOpen) return;
        const start = todayValue();
        setSchoolYearForm({
            start,
            end: schoolYearEnd && schoolYearEnd >= addThreeMonths(start) ? schoolYearEnd : addThreeMonths(start),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const generateSchoolYear = async () => {
        if (!schoolYearForm.start || !schoolYearForm.end) {
            toast.error("Selecciona las fechas de inicio y finalización.");
            return;
        }
        setGeneratingSchoolYear(true);
        try {
            await OrganizationConfigurationService.instance.generateSchoolYear(schoolYearForm.end);
            await Promise.all([
                queryClient.invalidateQueries({queryKey: queryKeys.organizationConfiguration.all}),
                queryClient.invalidateQueries({queryKey: queryKeys.period.all}),
            ]);
            onClose();
            toast.success("El año académico fue iniciado correctamente.");
        } catch (error) {
            toast.error((error as { message?: string })?.message ?? "No se pudo generar el año académico.");
        } finally {
            setGeneratingSchoolYear(false);
        }
    };

    return (
        <CenterModal
            title="Iniciar año escolar"
            description="Define el rango del nuevo período académico. Debe durar al menos tres meses."
            isOpen={isOpen}
            onClose={onClose}
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
                            <strong className="text-sm" style={{color: "var(--text-primary)"}}>{formatShortDate(today)}</strong>
                        </div>
                        <small className="mt-1.5 block px-1 text-xs" style={{color: "var(--text-tertiary)"}}>El período comienza hoy.</small>
                    </div>
                    <DatePicker
                        label="Fecha de finalización"
                        value={schoolYearForm.end}
                        min={addThreeMonths(today)}
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
                    <button type="button" className="btn btn-sm" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-sm btn-primary" disabled={generatingSchoolYear}>
                        <i className={generatingSchoolYear ? "fa fa-spinner fa-spin me-1" : "fa fa-calendar-check me-1"}/>
                        {generatingSchoolYear ? "Iniciando..." : "Iniciar año escolar"}
                    </button>
                </div>
            </form>
        </CenterModal>
    );
});
