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
                        className="btn btn-sm btn-primary"
                        type="button"
                    >
                        <i className={downloading ? "fa fa-spinner fa-spin me-1" : "fa fa-download me-1"} />
                        Descargar plantilla
                    </button>
                </div>
            )}
        </div>
    );
};