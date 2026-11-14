import ReactDatePicker from "react-datepicker";
import {es} from "date-fns/locale";
import clsx from "clsx";
import "react-datepicker/dist/react-datepicker.css";
import {calendarHeader, DateTrigger} from "./CalendarHeader.tsx";

type DatePickerProps = {
    label?: string;
    value: string;
    min?: string;
    /** Última fecha que se puede elegir (yyyy-mm-dd). */
    max?: string;
    placeholder?: string;
    /** Permite dejar la fecha vacía (aparece una ✕ para borrarla). */
    clearable?: boolean;
    /** Ocupa todo el ancho disponible salvo que aquí se indique otro. */
    className?: string;
    helper?: string;
    required?: boolean;
    disabled?: boolean;
    onChange: (value: string) => void;
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

/**
 * Selector de fecha del sistema. Es uno solo a propósito: mismo botón, mismo calendario y mismas listas
 * de mes y año en todas las pantallas.
 */
export const DatePicker = ({
    label,
    value,
    min,
    max,
    placeholder,
    clearable,
    className,
    helper,
    required,
    disabled,
    onChange,
}: DatePickerProps) => {
    const minDate = parseDate(min);
    const maxDate = parseDate(max);

    return (
        // Es un div y no un label: un label reenvía el clic de un día del calendario al botón y lo vuelve a abrir.
        <div className={clsx("block", className)}>
            {label && <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>{label}</span>}
            <ReactDatePicker
                selected={parseDate(value)}
                minDate={minDate ?? undefined}
                maxDate={maxDate ?? undefined}
                onChange={(date: Date | null) => date ? onChange(serializeDate(date)) : clearable && onChange("")}
                isClearable={clearable && Boolean(value)}
                placeholderText={placeholder}
                locale={es}
                dateFormat="dd 'de' MMMM 'de' yyyy"
                calendarStartDay={1}
                disabled={disabled}
                required={required}
                showPopperArrow={false}
                popperPlacement="bottom-end"
                popperProps={{strategy: "fixed"}}
                wrapperClassName="!block w-full"
                calendarClassName="spms-date-calendar"
                popperClassName="spms-date-popper"
                renderCustomHeader={calendarHeader({min: minDate, max: maxDate})}
                customInput={<DateTrigger disabled={disabled} placeholder={placeholder}/>}
            />
            {helper && <small className="mt-1.5 block px-1 text-xs leading-5" style={{color: "var(--text-tertiary)"}}>{helper}</small>}
        </div>
    );
};
