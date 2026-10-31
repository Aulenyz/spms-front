import {environment} from "../../../environment/environment.ts";
import {joinURLParts} from "../../../utils/URIs.ts";
import {OrganizationConfiguration} from "../../../services/configuration/OrganizationConfigurationService.ts";

export const formatShortDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("es", {day: "2-digit", month: "short", year: "numeric"}).format(date);
};

export const resolveLogo = (value?: string | null) => {
    const raw = (value ?? "").toString().trim();
    if (!raw) return null;
    if (/^data:/i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    // Backend may return relative paths; normalize against api URL.
    return joinURLParts(environment.apiURL, raw.startsWith("/") ? raw : `/${raw}`);
};

export const resolveOrganizationHeaderValue = (organization?: { id?: string | number } | null) => {
    if (organization?.id === undefined || organization?.id === null) return "";
    return String(organization.id);
};

export const initialsOf = (name?: string) => (name ?? "")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const todayValue = () => new Date().toLocaleDateString("en-CA");

export const tomorrowValue = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString("en-CA");
};

export const dayAfter = (value?: string) => {
    if (!value) return tomorrowValue();
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString("en-CA");
};

export const addThreeMonths = (value?: string) => {
    const tomorrow = tomorrowValue();
    if (!value) return tomorrow;
    const date = new Date(`${value}T12:00:00`);
    date.setMonth(date.getMonth() + 3);
    const result = date.toLocaleDateString("en-CA");
    return result > tomorrow ? result : tomorrow;
};

export const configurationValue = (settings: OrganizationConfiguration[], name: string) =>
    settings.find((configuration) => configuration.name === name)?.value;
