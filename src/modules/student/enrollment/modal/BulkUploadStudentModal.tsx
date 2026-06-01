
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { RightModal } from '../../../../components/shared/RightModal';
import { StudentService } from '../../../../services/student/StudentService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const studentService = StudentService.instance;

export const BulkUploadStudentModal = ({ isOpen, onClose }: Props) => {
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
        maxSize: 10 * 1024 * 1024, // 10 MB
        multiple: false,
        onDrop: (accepted) => {
            // TODO: conectar con el endpoint de carga masiva
            console.log('Archivo seleccionado:', accepted[0]);
        },
    });

    return (
        <RightModal
            title="Carga masiva"
            isOpen={isOpen}
            onClose={onClose}
            className="w-[520px] h-full z-[9999]"
        >
            <div className="flex flex-col h-full">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm text-slate-500">
                            Suba un archivo
                        </p>
                    </div>
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-sm"
                    >
                        <i className={downloading ? 'fa fa-spinner fa-spin text-blue-500' : 'fa fa-download text-blue-500'} />
                        <span>Descargar plantilla</span> 
                    </button>
                </div>

                {/* DROPZONE */}
                <div className="border border-slate-200 rounded-xl p-4">
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
                    </div>
                </div>

                {/* FOOTER */}
                <div className="pt-4 mt-auto flex justify-end gap-2 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </RightModal>
    );
};