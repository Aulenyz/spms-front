// src/modules/student/bulk-upload/BulkLoadBreadcrumb.tsx

import { useAuthContext } from "../../contexts/AuthContext.tsx";
import { AuthorityKey } from "../../domain/model/user/authorities.ts";

interface Props {
    onDownload: () => void;
    downloading?: boolean;
}

export const BulkLoadBreadcrumb = ({ onDownload, downloading = false }: Props) => {
    const { hasAuthority } = useAuthContext();

    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border px-4 py-3"
            style={{
                borderColor: "var(--border-soft)",
                background: "color-mix(in srgb, var(--surface) 95%, transparent)",
                boxShadow: "var(--shadow-soft)",
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    Acciones rápidas
                </span>
            </div>

            {hasAuthority(AuthorityKey.STUDENT_CREATE) && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={onDownload}
                        disabled={downloading}
                        type="button"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 hover:text-green-800 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 shadow-sm"
                    >
                        <i className={downloading ? 'fa fa-spinner fa-spin text-green-600' : 'fa fa-file-excel text-green-600'} />
                        <span>{downloading ? 'Descargando...' : 'Descargar plantilla'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};