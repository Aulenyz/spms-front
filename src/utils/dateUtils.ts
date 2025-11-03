export const getYMD = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") {
        return val.split("T")[0];
    }
    if (val instanceof Date && !isNaN(val as any)) {
        return val.toISOString().split("T")[0];
    }
    try {
        const d = new Date(val);
        if (!isNaN(d as any)) return d.toISOString().split("T")[0];
    } catch (e) {}
    return "";
};

export const parseDate = (input: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (m) {
        const [_, y, mo, d] = m;
        return new Date(Number(y), Number(mo) - 1, Number(d));
    }
    return new Date(input);
};

export const dateFmt = new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

export const formatDisplayDate = (s: string) => {
    const d = parseDate(s);
    if (isNaN(d.getTime())) return s;
    return dateFmt.format(d).replace(',', '');
};

export const getYMDWithTime = (val: any): string => {
    const base = getYMD(val);
    return base ? `${base}T00:00:00` : "";
};