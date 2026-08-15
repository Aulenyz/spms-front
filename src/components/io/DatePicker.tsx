import {forwardRef} from "react";
import ReactDatePicker from "react-datepicker";
import {es} from "date-fns/locale";
import clsx from "clsx";
import "react-datepicker/dist/react-datepicker.css";

type DatePickerProps = {
    label?: string;
    value: string;
    min?: string;
    helper?: string;
    icon?: string;
    required?: boolean;
    disabled?: boolean;
    compact?: boolean;
    onChange: (value: string) => void;
};

type TriggerProps = {
    value?: string;
    onClick?: VoidFunction;
    disabled?: boolean;
    icon: string;
    compact?: boolean;
    placeholder?: string;
};

const parseDate = (value?: string): Date | null => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
};

const serializeDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const DateTrigger = forwardRef<HTMLButtonElement, TriggerProps>(
    ({value, onClick, disabled, icon, compact, placeholder}, ref) => (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "date-picker-trigger group flex w-full items-center gap-3 rounded-[15px] border px-3 text-left shadow-sm transition-all duration-200",
                compact ? "h-11" : "h-12",
            )}
        >
            <span className="date-picker-trigger-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]">
                <i className={`fa ${icon}`}/>
            </span>
            <span className={clsx("min-w-0 flex-1 text-xs font-semibold", !value && "opacity-55")}>
                {value || placeholder || "Seleccionar fecha"}
            </span>
            <i className="fa fa-chevron-down text-[10px] opacity-40 transition group-hover:opacity-75"/>
        </button>
    ),
);

DateTrigger.displayName = "DateTrigger";

export const DatePicker = ({
    label,
    value,
    min,
    helper,
    icon = "fa-calendar-days",
    required,
    disabled,
    compact,
    onChange,
}: DatePickerProps) => (
    <label className={clsx("block", compact && "w-[220px] shrink-0")}>
        {label && <span className="mb-2 block text-sm font-bold" style={{color: "var(--text-primary)"}}>{label}</span>}
        <ReactDatePicker
            selected={parseDate(value)}
            minDate={parseDate(min) ?? undefined}
            onChange={(date: Date | null) => date && onChange(serializeDate(date))}
            locale={es}
            dateFormat="dd 'de' MMMM 'de' yyyy"
            calendarStartDay={1}
            disabled={disabled}
            required={required}
            showPopperArrow={false}
            popperPlacement="bottom-end"
            popperProps={{strategy: "fixed"}}
            calendarClassName="spms-date-calendar"
            popperClassName="spms-date-popper"
            customInput={<DateTrigger icon={icon} compact={compact} disabled={disabled}/>} 
        />
        {helper && <small className="mt-1.5 block px-1 text-xs leading-5" style={{color: "var(--text-tertiary)"}}>{helper}</small>}
    </label>
);
