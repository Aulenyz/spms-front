// src/modules/student/bulk-upload/BulkUploadStudentPage.tsx

import { useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { toast } from 'react-toastify';
import { PageHeader } from '../../../components/ui/layout/PageHeader';
import { StudentService } from '../../../services/student/StudentService';
import { BulkLoadBreadcrumb } from '../../breadcrumb/BulkLoadBreadcrumb';
import { ValidationConsole } from './ValidationConsole';
import { BulkValidationResult } from '../../../domain/student/BulkValidation.ts';

const studentService = StudentService.instance;

type DropzoneStatus = 'idle' | 'success' | 'error';

interface FileInfo {
    name: string;
    sizeKb: number;
}

const formatRejectionMessage = (rejections: FileRejection[]): string => {
    const firstError = rejections[0]?.errors[0];
    if (!firstError) return 'Archivo no válido.';
    switch (firstError.code) {
        case 'file-invalid-type': return 'Formato no permitido. Solo se aceptan archivos .xlsx.';
        case 'file-too-large':    return 'El archivo supera el límite de 10MB.';
        case 'too-many-files':    return 'Solo se permite subir un archivo a la vez.';
        default:                  return firstError.message ?? 'Error desconocido al cargar el archivo.';
    }
};

export const BulkUploadStudentPage = () => {
    const [downloading, setDownloading]           = useState(false);
    const [status, setStatus]                     = useState<DropzoneStatus>('idle');
    const [fileInfo, setFileInfo]                 = useState<FileInfo | null>(null);
    const [errorMessage, setErrorMessage]         = useState<string>('');
    const [validating, setValidating]             = useState(false);
    const [validationResult, setValidationResult] = useState<BulkValidationResult | null>(null);
    const [validatedAt, setValidatedAt]           = useState<Date | null>(null);

    const hasBlockingErrors = (validationResult?.summary.errors ?? 0) > 0;

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            await studentService.downloadTemplate();
        } finally {
            setDownloading(false);
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setFileInfo(null);
        setErrorMessage('');
        setValidationResult(null);
        setValidatedAt(null);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        maxSize: 10 * 1024 * 1024,
        multiple: false,
        onDrop: async (acceptedFiles, fileRejections) => {
            if (fileRejections.length > 0) {
                setStatus('error');
                setFileInfo(null);
                setErrorMessage(formatRejectionMessage(fileRejections));
                setValidationResult(null);
                return;
            }

            if (acceptedFiles.length === 0) return;

            const file = acceptedFiles[0];

            setFileInfo({ name: file.name, sizeKb: Math.round(file.size / 1024) });
            setStatus('success');
            setValidationResult(null);
            setValidating(true);

            try {
                const response = await studentService.validateBulk(file);
                const result = response.result;

                setValidationResult(result);
                setValidatedAt(new Date());

                // Toast según resultado de validación del backend
                if (result.summary.errors > 0) {
                    toast.error('El archivo contiene errores. Corrígelos y vuelve a cargar el archivo.');
                } else {
                    toast.success('El archivo fue validado correctamente.');
                }
            } catch {
                setStatus('error');
                setFileInfo(null);
                setErrorMessage('No se pudo conectar con el servidor para validar el archivo.');
                setValidationResult(null);
                toast.error('No se pudo conectar con el servidor para validar el archivo.');
            } finally {
                setValidating(false);
            }
        },
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Carga masiva"
                description="Suba su archivo o descargue la plantilla para rellenarla y subirla."
            />
            <BulkLoadBreadcrumb
                onDownload={handleDownloadTemplate}
                downloading={downloading}
            />

            {/* DROPZONE CARD */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-4">
                    <i className="fa fa-upload text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                        Cargar archivo de excel (.xlsx)
                    </span>
                </div>

                {/* IDLE */}
                {status === 'idle' && (
                    <div
                        {...getRootProps()}
                        className={`
                            rounded-lg border-2 border-dashed cursor-pointer
                            flex flex-col items-center justify-center gap-2 py-14 px-6 text-center
                            transition-colors duration-200
                            ${isDragActive
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <i className="fa fa-folder-open text-2xl text-blue-400" />
                        <p className="text-sm text-slate-600">
                            Arrastra un archivo .xlsx o haz{' '}
                            <span className="text-blue-500 underline cursor-pointer">click para cargar</span>
                        </p>
                        <p className="text-xs text-slate-400">
                            Sólo se permite subir un archivo .xlsx de máximo 10MB.
                        </p>
                    </div>
                )}

                {/* SUCCESS */}
                {status === 'success' && fileInfo && (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow transition-all duration-200">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50">
                                <i className="fa fa-file-excel text-2xl text-green-600" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold text-slate-700 tracking-tight">{fileInfo.name}</p>
                                <p className="text-xs font-medium text-slate-400">{fileInfo.sizeKb} KB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {validating ? (
                                <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                    <i className="fa fa-spinner fa-spin text-blue-400" />
                                    Validando archivo...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <i className="fa fa-check-circle text-lg text-green-500" />
                                    Archivo cargado correctamente
                                </span>
                            )}
                            <button
                                onClick={handleReset}
                                disabled={validating}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 disabled:opacity-40 transition-all duration-150"
                                title="Eliminar archivo"
                                type="button"
                            >
                                <i className="fa fa-times text-sm" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ERROR */}
                {status === 'error' && (
                    <div
                        {...getRootProps()}
                        className="rounded-lg border-2 border-dashed border-red-400 bg-red-50 cursor-pointer
                                   flex flex-col items-center justify-center gap-2 py-14 px-6 text-center
                                   transition-colors duration-200 hover:bg-red-100"
                    >
                        <input {...getInputProps()} />
                        <i className="fa fa-exclamation-circle text-2xl text-red-500" />
                        <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                            className="mt-1 text-xs text-red-400 underline hover:text-red-600"
                            type="button"
                        >
                            Limpiar e intentar de nuevo
                        </button>
                    </div>
                )}
            </div>

            {/* CONSOLA DE VALIDACIÓN */}
            {validationResult && validatedAt && (
                <ValidationConsole result={validationResult} validatedAt={validatedAt} />
            )}

            {/* FOOTER */}
            {validationResult && (
                <div className="flex items-center justify-end">
                    <button
                        disabled={hasBlockingErrors}
                        className="btn btn-sm btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        type="button"
                        onClick={() => {
                            // TODO: conectar con el endpoint de carga definitiva
                        }}
                    >
                        <i className="fa fa-arrow-right me-1" />
                        Continuar
                    </button>
                </div>
            )}
        </div>
    );
};