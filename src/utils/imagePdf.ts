const PAGE_WIDTH = 842; // A4 apaisado, en puntos
const PAGE_HEIGHT = 595;
const MARGIN = 20;

const encoder = new TextEncoder();

/**
 * PDF de una sola página A4 apaisada con una imagen JPEG centrada y escalada para que quepa entera.
 * Se arma a mano (sin librerías): catálogo, página, contenido, imagen y tabla de referencias.
 *
 * @param jpeg bytes de la imagen JPEG
 * @param width ancho de la imagen en píxeles
 * @param height alto de la imagen en píxeles
 */
export const imagePdf = (jpeg: Uint8Array, width: number, height: number): Uint8Array => {
    const scale = Math.min((PAGE_WIDTH - 2 * MARGIN) / width, (PAGE_HEIGHT - 2 * MARGIN) / height);
    const drawnWidth = width * scale;
    const drawnHeight = height * scale;
    const x = (PAGE_WIDTH - drawnWidth) / 2;
    const y = (PAGE_HEIGHT - drawnHeight) / 2;
    const content = `q ${drawnWidth.toFixed(2)} 0 0 ${drawnHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;

    const parts: Uint8Array[] = [];
    const offsets: number[] = [];
    let length = 0;
    const push = (data: string | Uint8Array) => {
        const bytes = typeof data === "string" ? encoder.encode(data) : data;
        parts.push(bytes);
        length += bytes.length;
    };
    const object = (id: number, ...chunks: Array<string | Uint8Array>) => {
        offsets[id] = length;
        push(`${id} 0 obj\n`);
        chunks.forEach(push);
        push("\nendobj\n");
    };

    push("%PDF-1.4\n%âãÏÓ\n");
    object(1, "<< /Type /Catalog /Pages 2 0 R >>");
    object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] `
        + "/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>");
    object(4, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    object(5, `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB `
        + `/BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, "\nendstream");

    const xref = length;
    const rows = [1, 2, 3, 4, 5].map((id) => `${String(offsets[id]).padStart(10, "0")} 00000 n \n`).join("");
    push(`xref\n0 6\n0000000000 65535 f \n${rows}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

    const pdf = new Uint8Array(length);
    let position = 0;
    parts.forEach((part) => {
        pdf.set(part, position);
        position += part.length;
    });
    return pdf;
};
