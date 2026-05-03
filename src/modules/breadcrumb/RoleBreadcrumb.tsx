export const RoleBreadcrumb = ({onCreate}: {onCreate: () => void}) => {
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
                <span className="text-sm font-semibold" style={{color: "var(--text-secondary)"}}>
                    Acciones rapidas
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={onCreate} className="btn btn-sm btn-primary" type="button">
                    <i className="fa fa-plus me-1"/>
                    Nuevo rol
                </button>
            </div>
        </div>
    );
};

