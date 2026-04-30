type EmptyStateProps = {
    title: string;
    description: string;
    icon?: string;
};

export const EmptyState = ({title, description, icon = "fa-box-open"}: EmptyStateProps) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <i className={`fa ${icon}`}/>
            </div>
            <div className="space-y-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{description}</p>
            </div>
        </div>
    );
};
