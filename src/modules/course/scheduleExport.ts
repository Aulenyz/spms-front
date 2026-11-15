import {CourseAcademicAssignment} from "../../domain/model/course/Course.ts";
import {imagePdf} from "../../utils/imagePdf.ts";
import {DAYS, DayLabel, DayOfWeek, hhmm} from "./template/schedule.ts";

export type ScheduleExportInput = {
    title: string;
    subtitle?: string;
    assignments: CourseAcademicAssignment[];
};

const SCALE = 2; // nitidez de la imagen
const WIDTH = 1600; // ancho lógico: la hoja sale apaisada
const MARGIN = 40;
const TIME_COLUMN = 150;
const HEADER = 120;
const DAY_ROW = 46;
const FOOTER = 48;
const BLOCK_PADDING = 10;
const SUBJECT_LINE = 21;
const TEACHER_LINE = 18;
const MIN_ROW = 76;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Un color por materia, legible también impreso en blanco y negro. */
const PALETTE = [
    {fill: "#e0e7ff", edge: "#4f46e5"}, {fill: "#d1fae5", edge: "#059669"}, {fill: "#fef3c7", edge: "#d97706"},
    {fill: "#fee2e2", edge: "#dc2626"}, {fill: "#cffafe", edge: "#0891b2"}, {fill: "#fae8ff", edge: "#a21caf"},
    {fill: "#ffedd5", edge: "#ea580c"}, {fill: "#e2e8f0", edge: "#475569"},
];

type Block = { subject: string; teacher: string; color: typeof PALETTE[number]; subjectLines: string[] };
type Row = { time: string; cells: Map<DayOfWeek, Block[]>; height: number };

/** Parte el texto en líneas que quepan en el ancho; la última termina en "…" si no alcanza. */
const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !current) current = candidate;
        else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines.map((line) => fit(ctx, line, maxWidth));
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fit(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(" ")}`, maxWidth);
    return kept;
};

/** Recorta con "…" una sola línea que no cabe. */
const fit = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let end = text.length;
    while (end > 1 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) end -= 1;
    return `${text.slice(0, end).trimEnd()}…`;
};

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
};

/**
 * Dibuja el horario semanal del curso en un lienzo apaisado: una fila por franja horaria y una columna por día,
 * con la materia y el profesor de cada clase. Devuelve null si el curso no tiene clases.
 */
export const drawSchedule = ({title, subtitle, assignments}: ScheduleExportInput): HTMLCanvasElement | null => {
    const slots = assignments.flatMap((assignment) => (assignment.slots ?? []).map((slot) => ({slot, assignment})));
    if (slots.length === 0) return null;

    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return null;

    const subjects = [...new Set(assignments.map((assignment) => assignment.subject?.name ?? ""))].sort((a, b) => a.localeCompare(b, "es"));
    const days = DAYS.filter((day, index) => index < 5 || slots.some(({slot}) => slot.dayOfWeek === day));
    const dayWidth = (WIDTH - 2 * MARGIN - TIME_COLUMN) / days.length;

    const grouped = new Map<string, Row>();
    slots.forEach(({slot, assignment}) => {
        const time = `${hhmm(slot.startsAt)}–${hhmm(slot.endsAt)}`;
        const row = grouped.get(time) ?? {time, cells: new Map<DayOfWeek, Block[]>(), height: MIN_ROW};
        grouped.set(time, row);
        measure.font = `700 17px ${FONT}`;
        const name = assignment.subject?.name ?? "Materia";
        const block: Block = {
            subject: name,
            teacher: assignment.teacher?.name ?? "Sin profesor",
            color: PALETTE[Math.max(subjects.indexOf(name), 0) % PALETTE.length],
            subjectLines: wrap(measure, name, dayWidth - 2 * BLOCK_PADDING - 8, 2),
        };
        row.cells.set(slot.dayOfWeek, [...(row.cells.get(slot.dayOfWeek) ?? []), block]);
    });
    const blockHeight = (block: Block) => BLOCK_PADDING * 2 + block.subjectLines.length * SUBJECT_LINE + 4 + TEACHER_LINE;
    const rows = [...grouped.values()].sort((a, b) => a.time.localeCompare(b.time));
    rows.forEach((row) => {
        row.height = Math.max(MIN_ROW, ...[...row.cells.values()].map((blocks) => blocks.reduce((sum, block) => sum + blockHeight(block) + 6, 6)));
    });

    const height = HEADER + DAY_ROW + rows.reduce((sum, row) => sum + row.height, 0) + FOOTER + MARGIN;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * SCALE;
    canvas.height = height * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(SCALE, SCALE);
    ctx.textBaseline = "alphabetic";

    // Fondo blanco (el JPEG del PDF no tiene transparencia)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, height);

    // Encabezado
    ctx.fillStyle = "#111827";
    ctx.font = `800 34px ${FONT}`;
    ctx.fillText(fit(ctx, title, WIDTH - 2 * MARGIN - 260), MARGIN, MARGIN + 32);
    if (subtitle) {
        ctx.fillStyle = "#4b5563";
        ctx.font = `500 18px ${FONT}`;
        ctx.fillText(fit(ctx, subtitle, WIDTH - 2 * MARGIN - 260), MARGIN, MARGIN + 62);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "#4f46e5";
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText("HORARIO SEMANAL", WIDTH - MARGIN, MARGIN + 30);
    ctx.textAlign = "left";

    // Fila de días
    const top = HEADER;
    ctx.fillStyle = "#1f2544";
    roundedRect(ctx, MARGIN, top, WIDTH - 2 * MARGIN, DAY_ROW, 10);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("HORA", MARGIN + TIME_COLUMN / 2, top + 29);
    days.forEach((day, index) => ctx.fillText(DayLabel[day].toUpperCase(), MARGIN + TIME_COLUMN + dayWidth * index + dayWidth / 2, top + 29));

    // Filas por franja horaria
    let y = top + DAY_ROW;
    rows.forEach((row, rowIndex) => {
        ctx.fillStyle = rowIndex % 2 === 0 ? "#f9fafb" : "#ffffff";
        ctx.fillRect(MARGIN, y, WIDTH - 2 * MARGIN, row.height);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MARGIN, y + row.height);
        ctx.lineTo(WIDTH - MARGIN, y + row.height);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "#111827";
        ctx.font = `700 16px ${FONT}`;
        ctx.fillText(row.time, MARGIN + TIME_COLUMN / 2, y + row.height / 2 + 6);

        days.forEach((day, index) => {
            const blocks = row.cells.get(day) ?? [];
            const x = MARGIN + TIME_COLUMN + dayWidth * index;
            let blockTop = y + 6;
            blocks.forEach((block) => {
                const blockHeightValue = row.cells.get(day)!.length === 1 ? row.height - 12 : blockHeight(block);
                ctx.fillStyle = block.color.fill;
                roundedRect(ctx, x + 6, blockTop, dayWidth - 12, blockHeightValue, 10);
                ctx.fill();
                ctx.fillStyle = block.color.edge;
                roundedRect(ctx, x + 6, blockTop, 5, blockHeightValue, 3);
                ctx.fill();

                ctx.textAlign = "left";
                const left = x + 6 + BLOCK_PADDING + 6;
                const textHeight = block.subjectLines.length * SUBJECT_LINE + 4 + TEACHER_LINE;
                let baseline = blockTop + (blockHeightValue - textHeight) / 2 + 16;
                ctx.fillStyle = "#111827";
                ctx.font = `700 17px ${FONT}`;
                block.subjectLines.forEach((line) => {
                    ctx.fillText(line, left, baseline);
                    baseline += SUBJECT_LINE;
                });
                ctx.fillStyle = "#374151";
                ctx.font = `500 14px ${FONT}`;
                ctx.fillText(fit(ctx, block.teacher, dayWidth - 2 * BLOCK_PADDING - 14), left, baseline + 2);
                blockTop += blockHeight(block) + 6;
            });
        });
        y += row.height;
    });

    // Pie
    ctx.textAlign = "left";
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText(`Generado el ${new Date().toLocaleDateString("es", {day: "numeric", month: "long", year: "numeric"})}`, MARGIN, y + 30);
    ctx.textAlign = "right";
    ctx.fillText("Aulenyx · Sistema de Campus Inteligente", WIDTH - MARGIN, y + 30);
    return canvas;
};

const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo crear la imagen.")), type, quality));

/** "Tercero A" → "tercero-a" para el nombre del archivo. */
export const fileNameOf = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Descarga el horario como imagen PNG apaisada. */
export const downloadScheduleImage = async (input: ScheduleExportInput, filename: string) => {
    await document.fonts?.ready;
    const canvas = drawSchedule(input);
    if (!canvas) throw new Error("El curso no tiene clases para exportar.");
    download(await toBlob(canvas, "image/png"), `${filename}.png`);
};

/** Descarga el horario como PDF de una página A4 apaisada donde cabe todo. */
export const downloadSchedulePdf = async (input: ScheduleExportInput, filename: string) => {
    await document.fonts?.ready;
    const canvas = drawSchedule(input);
    if (!canvas) throw new Error("El curso no tiene clases para exportar.");
    const jpeg = new Uint8Array(await (await toBlob(canvas, "image/jpeg", 0.95)).arrayBuffer());
    download(new Blob([imagePdf(jpeg, canvas.width, canvas.height)], {type: "application/pdf"}), `${filename}.pdf`);
};
