import imageCompression, {Options} from 'browser-image-compression';
import {Optional} from "../domain/types/steoreotype.ts";


const options: Options = {
    maxSizeMB: 1, // Target file size in MB
    useWebWorker: true, // Enable web worker for faster processing
};

export const compress = async (file: File): Promise<File> => {
    // Compress the file
    const compressed: File = await imageCompression(file, options);
    // Sanitizes the filename to prevent ilegal characters
    const filename: string = sanitizeFilename(compressed.name);
    // returns the resulting file with new name
    return new File([compressed], filename);
};

export const sanitizeFilename = (filename: string) => {
    const extension: Optional<string> = filename.includes('.') ? filename.split('.').pop() : '';
    const name: string = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const sanitized: string = name.replace(/[\/\\:*?"<>|]/g, '_').trim(); // Replace illegal characters
    return extension ? `${sanitized}.${extension}` : sanitized;
};