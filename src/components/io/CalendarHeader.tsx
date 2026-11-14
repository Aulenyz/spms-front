import {forwardRef} from "react";
import {ReactDatePickerCustomHeaderProps} from "react-datepicker";
import clsx from "clsx";

const MONTHS = Array.from({length: 12}, (_, month) =>
    new Intl.DateTimeFormat("es", {month: "long"}).format(new Date(2020, month, 1)));

/** Años que se ofrecen cuando no hay fecha mínima o máxima. */
const YEARS_BACK = 100;
const YEARS_AHEAD = 10;

type TriggerProps = {
    value?: string;
    onClick?: VoidFunction;
    disabled?: boolean;
    placeholder?: string;
};

/** Botón que abre el calendario; es el mismo para una fecha y para un rango. */
export const DateTrigger = forwardRef<HTMLButtonElement, TriggerProps>(({value, onClick, disabled, placeholder}, ref) => (
    <button ref={ref} type="button" onClick={onClick} disabled={disabled}
            className="date-picker-trigger group flex h-11 w-full items-center gap-3 rounded-[15px] border px-3 text-left shadow-sm transition-all duration-200">
        <span className="date-picker-trigger-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]">
            <i className="fa fa-calendar-days"/>
        </span>
        <span className={clsx("min-w-0 flex-1 truncate text-xs font-semibold", !value && "opacity-55")}>
            {value || placeholder || "Seleccionar fecha"}
        </span>
        <i className="fa fa-chevron-down text-[10px] opacity-40 transition group-hover:opacity-75"/>
    </button>
));

DateTrigger.displayName = "DateTrigger";

type HeaderOptions = {
    min?: Date | null;
    max?: Date | null;
    /** Meses que se muestran a la vez; con más de uno el título es fijo y no se puede saltar de año. */
    months?: number;
};

/**
 * Cabecera del calendario: flechas para pasar de mes y, con un solo mes a la vista, listas para saltar
 * directo a cualquier mes y año (una fecha de nacimiento no se busca mes por mes).
 */
export const calendarHeader = ({min, max, months = 1}: HeaderOptions) => {
    const Header = ({
        monthDate, changeMonth, changeYear, decreaseMonth, increaseMonth,
        prevMonthButtonDisabled, nextMonthButtonDisabled, customHeaderCount,
    }: ReactDatePickerCustomHeaderProps) => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const thisYear = new Date().getFullYear();
        const firstYear = Math.min(min?.getFullYear() ?? thisYear - YEARS_BACK, year);
        const lastYear = Math.max(max?.getFullYear() ?? thisYear + YEARS_AHEAD, year);

        const firstMonthOf = (target: number) => min && target === min.getFullYear() ? min.getMonth() : 0;
        const lastMonthOf = (target: number) => max && target === max.getFullYear() ? max.getMonth() : 11;

        const pickYear = (target: number) => {
            changeYear(target);
            // Al cambiar de año el mes puede quedar fuera del rango permitido.
            const clamped = Math.min(Math.max(month, firstMonthOf(target)), lastMonthOf(target));
            if (clamped !== month) changeMonth(clamped);
        };

        return (
            <div className="spms-date-header">
                <button type="button" className="spms-date-nav" aria-label="Mes anterior" onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        style={{visibility: customHeaderCount === 0 ? "visible" : "hidden"}}>
                    <i className="fa fa-chevron-left"/>
                </button>
                {months > 1 ? (
                    <span className="spms-date-title">{MONTHS[month]} {year}</span>
                ) : (
                    <div className="flex items-center gap-1">
                        <select className="spms-date-select" aria-label="Mes" value={month}
                                onChange={(event) => changeMonth(Number(event.target.value))}>
                            {MONTHS.map((name, index) => (
                                <option key={name} value={index} disabled={index < firstMonthOf(year) || index > lastMonthOf(year)}>
                                    {name.charAt(0).toUpperCase() + name.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select className="spms-date-select" aria-label="Año" value={year}
                                onChange={(event) => pickYear(Number(event.target.value))}>
                            {Array.from({length: lastYear - firstYear + 1}, (_, index) => lastYear - index).map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button type="button" className="spms-date-nav" aria-label="Mes siguiente" onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        style={{visibility: customHeaderCount === months - 1 ? "visible" : "hidden"}}>
                    <i className="fa fa-chevron-right"/>
                </button>
            </div>
        );
    };
    return Header;
};
