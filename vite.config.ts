import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

/** Agrupa dependencias de node_modules en chunks de vendor estables (mejor caché entre despliegues). */
const vendorChunks: Record<string, string[]> = {
    'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler', '@remix-run/router'],
    'vendor-query': ['@tanstack/react-query', '@tanstack/query-core'],
    'vendor-charts': ['chart.js', 'react-chartjs-2', '@kurkle/color'],
    'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'yup', 'property-expr', 'tiny-case', 'toposort'],
    'vendor-date': ['react-datepicker', 'date-fns', '@floating-ui'],
    'vendor-motion': ['framer-motion', 'motion-dom', 'motion-utils'],
    'vendor-ui': ['react-toastify', 'clsx'],
};

const packageName = (id: string): string | undefined => {
    const match = id.split('node_modules/').pop()?.match(/^(@[^/]+\/[^/]+|[^/]+)/);
    return match?.[1];
};

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (!id.includes('node_modules')) return undefined;
                    const name = packageName(id);
                    if (!name) return undefined;
                    for (const [chunk, packages] of Object.entries(vendorChunks)) {
                        if (packages.some((pkg) => name === pkg || name.startsWith(`${pkg}/`))) return chunk;
                    }
                    return undefined;
                },
            },
        },
    },
});
