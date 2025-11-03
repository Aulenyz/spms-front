import {isNil} from "lodash";

export const calculateEndTime = (startTime: string, duration: string): string | null => {
    if (isNil(startTime) || isNil(duration)) {
        return null;
    }

    const startTimeParts: string[] = startTime.split(":");
    const startHour: number = Number(startTimeParts[0]);
    const startMinutes: number = Number(startTimeParts[1]);

    const durationHours: number = parseInt(duration.match(/(\d+)H/)?.[1] || "0", 10);
    const durationMinutes: number = parseInt(duration.match(/(\d+)M/)?.[1] || "0", 10);

    const totalMinutes: number = startHour * 60 + startMinutes + (durationHours * 60) + durationMinutes;

    const endHour: number = Math.floor((totalMinutes / 60) % 24);
    const endMinutes: number = totalMinutes % 60;

    const endHourString: string = String(endHour).padStart(2, "0");
    const endMinutesString: string = String(endMinutes).padStart(2, "0");

    return `${endHourString}:${endMinutesString}`;
};