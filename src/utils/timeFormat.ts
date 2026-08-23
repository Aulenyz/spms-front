export const timeInputValue = (value?: string) => value?.slice(0, 5) ?? "";

export const formatTime12 = (value?: string, fallback = "--:--") => {
    const normalized = timeInputValue(value);
    const [hourValue, minuteValue = "00"] = normalized.split(":");
    const hour = Number(hourValue);
    if (!normalized || Number.isNaN(hour)) return fallback;
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minuteValue.padStart(2, "0")} ${period}`;
};

export const formatTimeRange12 = (startsAt?: string, endsAt?: string, separator = " - ") =>
    `${formatTime12(startsAt)}${separator}${formatTime12(endsAt)}`;
