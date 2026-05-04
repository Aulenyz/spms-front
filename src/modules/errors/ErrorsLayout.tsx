import {Outlet} from 'react-router-dom';

export const ErrorsLayout = () => {
    return (
        <div
            className="min-h-screen"
            style={{
                background: "radial-gradient(circle at top, color-mix(in srgb, var(--accent-soft) 45%, white) 0%, var(--surface-muted) 32%, var(--surface) 100%)",
            }}
        >
            <Outlet/>
        </div>
    );
};
