import {CourseAcademicAssignment} from "../../domain/model/course/Course.ts";
import {imagePdf} from "../../utils/imagePdf.ts";
import {buildScheduleGrid, ScheduleBlock} from "./scheduleGrid.ts";
import {DayLabel} from "./template/schedule.ts";

export type ScheduleExportInput = {
    title: string;
    subtitle?: string;
    assignments: CourseAcademicAssignment[];
};

/**
 * Hoja carta (8.5 × 11 pulgadas) apaisada a 150 puntos por pulgada: la imagen tiene la misma proporción que la hoja,
 * así que el PDF la llena entera. Si el horario no cabe se agranda hacia abajo y el PDF lo reduce para que quepa.
 */
const SCALE = 2; // nitidez: el archivo sale a 300 puntos por pulgada
const WIDTH = 1650;
const PAGE_HEIGHT = 1275;
const MARGIN = 54; // ~0.36": dentro de lo que imprime cualquier impresora
const TIME_COLUMN = 176;
const HEADER = 138;
const DAY_ROW = 50;
const FOOTER = 52;
const MIN_ROW = 76;
const MAX_ROW = 190; // con pocas clases las filas no se estiran sin fin
const MAX_ZOOM = 1.4; // cuánto se agrandan los textos cuando sobra hoja
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

type BlockText = { subject: string[]; teacher: string[] };
type Sized = { lines: Map<ScheduleBlock, BlockText>; heights: number[]; unit: number };

/** Parte una palabra más ancha que la casilla en pedazos que sí quepan, para que nunca se corte. */
const breakWord = (ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] => {
    const pieces: string[] = [];
    let current = "";
    for (const character of word) {
        if (current && ctx.measureText(current + character).width > maxWidth) {
            pieces.push(current);
            current = character;
        } else current += character;
    }
    if (current) pieces.push(current);
    return pieces;
};

/** Parte el texto en líneas que quepan en el ancho; si sobran líneas, la última termina en "…". */
const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean)
        .flatMap((word) => ctx.measureText(word).width > maxWidth ? breakWord(ctx, word, maxWidth) : [word]);
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
    if (lines.length <= maxLines) return lines;
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

/** Alto del texto de una casilla: sus líneas de materia y de profesor. */
const textHeight = (text: BlockText, unit: number) => text.subject.length * 21 * unit + 4 + text.teacher.length * 18 * unit;

/**
 * Dibuja el horario semanal del curso en una hoja carta apaisada: una fila por franja horaria y una columna por día,
 * con la materia y el profesor de cada clase. Los textos y las filas se agrandan para llenar la hoja. Devuelve null
 * si el curso no tiene clases.
 */
export const drawSchedule = ({title, subtitle, assignments}: ScheduleExportInput): HTMLCanvasElement | null => {
    const grid = buildScheduleGrid(assignments);
    if (!grid) return null;

    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return null;

    const {days, rows} = grid;
    const dayWidth = (WIDTH - 2 * MARGIN - TIME_COLUMN) / days.length;
    const allBlocks = rows.flatMap((row) => [...row.cells.values()].flat());

    /** Mide cada casilla con los textos agrandados `unit` veces: sus líneas y la altura natural de cada fila. */
    const size = (unit: number): Sized => {
        const lines = new Map<ScheduleBlock, BlockText>();
        const textWidth = dayWidth - 2 * 10 * unit - 20;
        allBlocks.forEach((block) => {
            measure.font = `700 ${17 * unit}px ${FONT}`;
            const subject = wrap(measure, block.subject, textWidth, 3);
            measure.font = `500 ${14 * unit}px ${FONT}`;
            lines.set(block, {subject, teacher: wrap(measure, block.teacher, textWidth, 2)});
        });
        const blockHeight = (block: ScheduleBlock) => textHeight(lines.get(block)!, unit) + 20 * unit;
        const heights = rows.map((row) => Math.max(MIN_ROW * unit,
            ...[...row.cells.values()].map((blocks) => blocks.reduce((sum, block) => sum + blockHeight(block) + 6, 6))));
        return {lines, heights, unit};
    };

    // Si sobra hoja se agrandan los textos; si no cabe, la imagen crece hacia abajo y el PDF la reduce
    const available = PAGE_HEIGHT - HEADER - DAY_ROW - FOOTER - MARGIN;
    const total = (sized: Sized) => sized.heights.reduce((sum, value) => sum + value, 0);
    let sized = size(1);
    if (total(sized) < available) {
        const zoomed = size(Math.min(MAX_ZOOM, 1 + (available / total(sized) - 1) * 0.6));
        if (total(zoomed) <= available) sized = zoomed;
    }
    const unit = sized.unit;
    const spare = Math.max(0, available - total(sized));
    const heights = sized.heights.map((value) => Math.min(Math.max(value, MAX_ROW * unit), value + spare / rows.length));
    const tableHeight = heights.reduce((sum, value) => sum + value, 0);
    const height = Math.max(PAGE_HEIGHT, HEADER + DAY_ROW + tableHeight + FOOTER + MARGIN);

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
    ctx.font = `800 38px ${FONT}`;
    ctx.fillText(fit(ctx, title, WIDTH - 2 * MARGIN - 300), MARGIN, MARGIN + 36);
    if (subtitle) {
        ctx.fillStyle = "#4b5563";
        ctx.font = `500 20px ${FONT}`;
        ctx.fillText(fit(ctx, subtitle, WIDTH - 2 * MARGIN - 300), MARGIN, MARGIN + 68);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "#4f46e5";
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText("HORARIO SEMANAL", WIDTH - MARGIN, MARGIN + 34);
    ctx.textAlign = "left";

    // Fila de días
    const top = HEADER;
    ctx.fillStyle = "#1f2544";
    roundedRect(ctx, MARGIN, top, WIDTH - 2 * MARGIN, DAY_ROW, 10);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${16 * Math.min(unit, 1.2)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("HORA", MARGIN + TIME_COLUMN / 2, top + DAY_ROW / 2 + 6);
    days.forEach((day, index) => ctx.fillText(DayLabel[day].toUpperCase(), MARGIN + TIME_COLUMN + dayWidth * index + dayWidth / 2, top + DAY_ROW / 2 + 6));

    // Filas por franja horaria
    let y = top + DAY_ROW;
    rows.forEach((row, rowIndex) => {
        const rowHeight = heights[rowIndex];
        ctx.fillStyle = rowIndex % 2 === 0 ? "#f9fafb" : "#ffffff";
        ctx.fillRect(MARGIN, y, WIDTH - 2 * MARGIN, rowHeight);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(MARGIN, y + rowHeight);
        ctx.lineTo(WIDTH - MARGIN, y + rowHeight);
        ctx.stroke();

        // La hora va en una sola línea: si no cabe en su columna, la letra se achica
        ctx.textAlign = "center";
        ctx.fillStyle = "#111827";
        let timeSize = 16 * unit;
        ctx.font = `700 ${timeSize}px ${FONT}`;
        const timeWidth = ctx.measureText(row.time).width;
        if (timeWidth > TIME_COLUMN - 28) {
            timeSize *= (TIME_COLUMN - 28) / timeWidth;
            ctx.font = `700 ${timeSize}px ${FONT}`;
        }
        ctx.fillText(row.time, MARGIN + TIME_COLUMN / 2, y + rowHeight / 2 + timeSize * 0.36);

        days.forEach((day, index) => {
            const blocks = row.cells.get(day) ?? [];
            const x = MARGIN + TIME_COLUMN + dayWidth * index;
            const natural = (block: ScheduleBlock) => textHeight(sized.lines.get(block)!, unit) + 20 * unit;
            let blockTop = y + 6;
            blocks.forEach((block) => {
                const text = sized.lines.get(block)!;
                const blockHeight = blocks.length === 1 ? rowHeight - 12 : natural(block);
                ctx.fillStyle = block.color.fill;
                roundedRect(ctx, x + 6, blockTop, dayWidth - 12, blockHeight, 10);
                ctx.fill();
                ctx.fillStyle = block.color.edge;
                roundedRect(ctx, x + 6, blockTop, 5, blockHeight, 3);
                ctx.fill();

                ctx.textAlign = "left";
                const left = x + 6 + 10 * unit + 6;
                let baseline = blockTop + (blockHeight - textHeight(text, unit)) / 2 + 16 * unit;
                ctx.fillStyle = "#111827";
                ctx.font = `700 ${17 * unit}px ${FONT}`;
                text.subject.forEach((line) => {
                    ctx.fillText(line, left, baseline);
                    baseline += 21 * unit;
                });
                ctx.fillStyle = "#374151";
                ctx.font = `500 ${14 * unit}px ${FONT}`;
                text.teacher.forEach((line, lineIndex) => ctx.fillText(line, left, baseline + 2 + lineIndex * 18 * unit));
                blockTop += natural(block) + 6;
            });
        });
        y += rowHeight;
    });

    // Pie, siempre al borde inferior de la hoja
    const footer = height - MARGIN + 8;
    ctx.textAlign = "left";
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 14px ${FONT}`;
    ctx.fillText(`Generado el ${new Date().toLocaleDateString("es", {day: "numeric", month: "long", year: "numeric"})}`, MARGIN, footer);
    ctx.textAlign = "right";
    ctx.fillText("Aulenyx · Sistema de Campus Inteligente", WIDTH - MARGIN, footer);
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

/** Descarga el horario como imagen PNG con la proporción de una hoja carta apaisada. */
export const downloadScheduleImage = async (input: ScheduleExportInput, filename: string) => {
    await document.fonts?.ready;
    const canvas = drawSchedule(input);
    if (!canvas) throw new Error("El curso no tiene clases para exportar.");
    download(await toBlob(canvas, "image/png"), `${filename}.png`);
};

/** Descarga el horario como PDF de una hoja carta apaisada donde cabe todo. */
export const downloadSchedulePdf = async (input: ScheduleExportInput, filename: string) => {
    await document.fonts?.ready;
    const canvas = drawSchedule(input);
    if (!canvas) throw new Error("El curso no tiene clases para exportar.");
    const jpeg = new Uint8Array(await (await toBlob(canvas, "image/jpeg", 0.95)).arrayBuffer());
    download(new Blob([imagePdf(jpeg, canvas.width, canvas.height)], {type: "application/pdf"}), `${filename}.pdf`);
};
