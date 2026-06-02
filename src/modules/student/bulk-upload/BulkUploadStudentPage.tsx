// src/modules/student/bulk-upload/BulkUploadStudentPage.tsx

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '../../../components/ui/layout/PageHeader';
import { StudentService } from '../../../services/student/StudentService';
import { BulkLoadBreadcrumb } from '../../breadcrumb/BulkLoadBreadcrumb';

const studentService = StudentService.instance;

export const BulkUploadStudentPage = () => {
    const [downloading, setDownloading] = useState(false);

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        try {
            await studentService.downloadTemplate();
        } finally {
            setDownloading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        maxSize: 10 * 1024 * 1024,
        multiple: false,
        onDrop: (accepted) => {
            // TODO: conectar con el endpoint de carga masiva
            console.log('Archivo seleccionado:', accepted[0]);
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

            {/* DROPZONE */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center gap-2 mb-4">
                    <i className="fa fa-upload text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                        Cargar archivo de excel (.xlsx)
                    </span>
                </div>

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
                        <span className="text-blue-500 underline cursor-pointer">
                            click para cargar
                        </span>
                    </p>
                    <p className="text-xs text-slate-400">
                        Sólo se permite subir un archivo .xlsx de máximo 10MB.
                    </p>
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2">
            </div>
        </div>
    );
};