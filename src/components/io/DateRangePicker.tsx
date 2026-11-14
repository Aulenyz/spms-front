import {useEffect, useState} from "react";
import ReactDatePicker from "react-datepicker";
import {es} from "date-fns/locale";
import clsx from "clsx";
import "react-datepicker/dist/react-datepicker.css";
import {calendarHeader, DateTrigger} from "./CalendarHeader.tsx";

type DateRangePickerProps = {
    label?: string;
    start: Date | null;
    end: Date | null;
    min?: Date;
    max?: Date;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    /** Se llama cuando se eligieron las dos fechas. */
    onChange: (start: Date, end: Date) => void;
};

/**
 * Rango de fechas en un solo calendario: el primer clic marca el inicio y el segundo el final.
 */
export const DateRangePicker = ({label, start, end, min, max, placeholder, className, disabled, onChange}: DateRangePickerProps) => {
    // Mientras se elige, el rango puede quedar a medias (solo el inicio); se avisa al terminar.
    const [range, setRange] = useState<[Date | null, Date | null]>([start, end]);

    useEffect(() => setRange([start, end]), [start?.getTime(), end?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={clsx("block", className)}>
            {label && <span className="mb-1 block text-xs font-semibold" style={{color: "var(--text-secondary)"}}>{label}</span>}
            <ReactDatePicker
                selectsRange
                startDate={range[0] ?? undefined}
                endDate={range[1] ?? undefined}
                selected={range[0]}
                openToDate={range[0] ?? min}
                minDate={min}
                maxDate={max}
                onChange={([from, to]: [Date | null, Date | null]) => {
                    setRange([from, to]);
                    if (from && to) onChange(from, to);
                }}
                onCalendarClose={() => !range[1] && setRange([start, end])}
                monthsShown={2}
                locale={es}
                dateFormat="d MMM yyyy"
                calendarStartDay={1}
                disabled={disabled}
                showPopperArrow={false}
                popperPlacement="bottom-start"
                popperProps={{strategy: "fixed"}}
                wrapperClassName="!block w-full"
                calendarClassName="spms-date-calendar"
                popperClassName="spms-date-popper"
                renderCustomHeader={calendarHeader({min, max, months: 2})}
                customInput={<DateTrigger disabled={disabled} placeholder={placeholder ?? "Elegir desde y hasta"}/>}
            />
        </div>
    );
};
