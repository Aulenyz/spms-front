import {CSSProperties, ReactNode} from "react";
import {Link} from "react-router-dom";
import {motion} from "framer-motion";
import logo from "../../../assets/images/logo.png";
import {APP_DESCRIPTOR, APP_FULL_NAME, APP_SHORT_NAME} from "../../../app/config/branding.ts";
import {ThemeToggle} from "../theme/ThemeToggle.tsx";
import {APPVersion} from "../../io/output/shared/APPVersion.tsx";

type AuthShellProps = {
    title: string;
    description: string;
    form: ReactNode;
    accentTitle?: string;
    variant?: "login" | "recover" | "reset";
    backTo?: string;
    backLabel?: string;
};

type AuthVariant = NonNullable<AuthShellProps["variant"]>;

const variantTheme: Record<AuthVariant, {
    accent: string;
    secondary: string;
    badge: string;
    copy: string;
    chips: string[];
    stats: Array<{label: string; value: string;}>;
}> = {
    login: {
        accent: "#0f62fe",
        secondary: "#14b8a6",
        badge: "Campus conectado",
        copy: "Administra matricula, cobros escolares y accesos institucionales desde un mismo entorno.",
        chips: ["Matricula", "Tesoreria", "Accesos"],
        stats: [
            {label: "Cobertura", value: "Campus"},
            {label: "Accesos", value: "Seguro"},
            {label: "Entorno", value: "Escolar"},
        ],
    },
    recover: {
        accent: "#12805c",
        secondary: "#0f62fe",
        badge: "Recuperacion segura",
        copy: "Recupera tu acceso institucional sin salir del flujo principal del campus.",
        chips: ["Cuenta", "Seguridad", "Soporte"],
        stats: [
            {label: "Paso", value: "1/2"},
            {label: "Canal", value: "Seguro"},
            {label: "Estado", value: "Activo"},
        ],
    },
    reset: {
        accent: "#7c3aed",
        secondary: "#f59e0b",
        badge: "Clave renovada",
        copy: "Actualiza tu contrasena y vuelve al entorno institucional con una credencial nueva.",
        chips: ["Seguridad", "Validacion", "Continuidad"],
        stats: [
            {label: "Clave", value: "Nueva"},
            {label: "Nivel", value: "Alto"},
            {label: "Sesion", value: "Lista"},
        ],
    },
};

const floatingNodes = [
    {size: 184, top: "9%", left: "8%", delay: 0, duration: 12},
    {size: 116, top: "18%", right: "12%", delay: 1.2, duration: 9},
    {size: 132, bottom: "14%", left: "16%", delay: 0.6, duration: 10},
    {size: 88, bottom: "22%", right: "18%", delay: 1.8, duration: 8},
];

const backgroundParticles = [
    {size: 14, top: "14%", left: "36%", delay: 0.1, duration: 8},
    {size: 9, top: "23%", left: "74%", delay: 1.4, duration: 7},
    {size: 12, top: "64%", left: "58%", delay: 0.5, duration: 10},
    {size: 16, top: "78%", left: "20%", delay: 2.1, duration: 9},
    {size: 10, top: "42%", left: "10%", delay: 0.8, duration: 11},
    {size: 7, top: "31%", left: "88%", delay: 1.7, duration: 8},
    {size: 11, top: "87%", left: "72%", delay: 0.4, duration: 10},
    {size: 8, top: "9%", left: "57%", delay: 2.4, duration: 7},
];

const visualRings = [
    {size: 320, top: "-8%", left: "-4%", delay: 0.2, duration: 18},
    {size: 240, bottom: "6%", right: "10%", delay: 0.9, duration: 14},
];

const wavePaths = [
    {
        d: "M-40 140 C 120 80, 240 210, 420 150 S 700 70, 920 165",
        width: 2.2,
        opacity: 0.28,
        delay: 0,
        duration: 16,
    },
    {
        d: "M-20 310 C 110 230, 250 390, 430 320 S 700 240, 930 360",
        width: 1.6,
        opacity: 0.22,
        delay: 1.2,
        duration: 20,
    },
    {
        d: "M-60 520 C 120 470, 220 620, 430 560 S 690 470, 950 610",
        width: 2.4,
        opacity: 0.24,
        delay: 0.6,
        duration: 18,
    },
    {
        d: "M-80 210 C 90 150, 260 280, 470 220 S 730 120, 980 250",
        width: 1.8,
        opacity: 0.18,
        delay: 0.35,
        duration: 22,
    },
    {
        d: "M-30 420 C 130 350, 290 500, 520 430 S 760 340, 980 460",
        width: 1.9,
        opacity: 0.16,
        delay: 1.5,
        duration: 24,
    },
    {
        d: "M-90 600 C 110 540, 320 700, 540 610 S 790 520, 1010 660",
        width: 2.1,
        opacity: 0.14,
        delay: 0.9,
        duration: 26,
    },
];

export const AuthShell = ({
    title,
    description,
    form,
    accentTitle,
    variant = "login",
    backTo,
    backLabel,
}: AuthShellProps) => {
    const theme = variantTheme[variant];
    const shellStyle = {
        "--auth-accent": theme.accent,
        "--auth-secondary": theme.secondary,
    } as CSSProperties;

    return (
        <div className="auth-screen">
            <div className="auth-shell">
                <motion.div
                    className="auth-erp-stage"
                    style={shellStyle}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.35, ease: "easeOut"}}
                >
                    {backgroundParticles.map((particle, index) => (
                        <motion.span
                            key={`bg-particle-${index}`}
                            className="auth-erp-screen-particle"
                            style={particle}
                            animate={{
                                y: [0, -22, 0],
                                x: [0, 12, 0],
                                opacity: [0.18, 0.58, 0.18],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: particle.delay,
                            }}
                        />
                    ))}

                    <div className="auth-erp-topbar">
                        <div className="auth-shell-brand auth-shell-brand-erp">
                            <span className="auth-shell-brand-mark">
                                <img src={logo} alt={APP_SHORT_NAME} className="auth-shell-brand-mark-image"/>
                            </span>
                            <div className="leading-tight">
                                <strong className="block text-sm text-[var(--text-primary)]">{APP_SHORT_NAME}</strong>
                                <span className="text-xs text-[var(--text-secondary)]">{APP_DESCRIPTOR}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="auth-erp-topbar-chip">{APP_SHORT_NAME}</span>
                            <ThemeToggle/>
                        </div>
                    </div>

                    <div className="auth-erp-layout">
                        <aside className="auth-erp-visual">
                            <div className="auth-erp-visual-grid"/>

                            <svg
                                className="auth-erp-wave-layer"
                                viewBox="0 0 900 720"
                                preserveAspectRatio="none"
                                aria-hidden="true"
                            >
                                {wavePaths.map((path, index) => (
                                    <motion.path
                                        key={`wave-${index}`}
                                        d={path.d}
                                        className="auth-erp-wave-path"
                                        style={{
                                            strokeWidth: path.width,
                                            opacity: path.opacity,
                                        }}
                                        initial={{strokeDashoffset: 240}}
                                        animate={{strokeDashoffset: [240, 0, -240]}}
                                        transition={{
                                            duration: path.duration,
                                            repeat: Infinity,
                                            ease: "linear",
                                            delay: path.delay,
                                        }}
                                    />
                                ))}
                            </svg>

                            {visualRings.map((ring, index) => (
                                <motion.span
                                    key={`ring-${index}`}
                                    className="auth-erp-ring"
                                    style={ring}
                                    animate={{
                                        rotate: [0, 12, 0],
                                        scale: [1, 1.04, 1],
                                    }}
                                    transition={{
                                        duration: ring.duration,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: ring.delay,
                                    }}
                                />
                            ))}

                            {floatingNodes.map((node, index) => (
                                <motion.span
                                    key={`node-${index}`}
                                    className="auth-erp-orb"
                                    style={node}
                                    animate={{
                                        y: [0, -18, 0],
                                        x: [0, 10, 0],
                                        scale: [1, 1.06, 1],
                                    }}
                                    transition={{
                                        duration: node.duration,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: node.delay,
                                    }}
                                />
                            ))}

                            <div className="auth-erp-visual-body">
                                <span className="auth-erp-badge">
                                    {theme.badge}
                                </span>

                                <div className="auth-erp-hero">
                                    <span className="auth-erp-logo-shell">
                                        <img src={logo} alt="Logo institucional" className="auth-erp-logo-image"/>
                                    </span>

                                    <div className="space-y-3">
                                        <p className="auth-erp-kicker">{APP_SHORT_NAME}</p>
                                        <h2 className="auth-erp-title">{APP_FULL_NAME}</h2>
                                        <p className="auth-erp-copy">{accentTitle || theme.copy}</p>
                                    </div>
                                </div>

                                <div className="auth-erp-chip-row">
                                    {theme.chips.map((chip) => (
                                        <span key={chip} className="auth-erp-chip">
                                            {chip}
                                        </span>
                                    ))}
                                </div>

                                <div className="auth-erp-stats">
                                    {theme.stats.map((stat) => (
                                        <div key={stat.label} className="auth-erp-stat">
                                            <span>{stat.label}</span>
                                            <strong>{stat.value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <motion.section
                            className="auth-erp-panel"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{duration: 0.3, delay: 0.08}}
                        >
                            {backTo && backLabel && (
                                <div className="mb-6">
                                    <Link to={backTo} className="table-link text-sm">
                                        <i className="fa fa-arrow-left"/>
                                        <span>{backLabel}</span>
                                    </Link>
                                </div>
                            )}

                            <div className="auth-erp-panel-head">
                                <div className="auth-erp-panel-logo">
                                    <img src={logo} alt="Logo institucional" className="auth-erp-panel-logo-image"/>
                                </div>
                                <div className="space-y-2">
                                    <p className="auth-erp-panel-kicker">{APP_SHORT_NAME}</p>
                                    <h1 className="auth-erp-panel-title">{title}</h1>
                                    <p className="auth-erp-panel-description">{description}</p>
                                </div>
                            </div>

                            {form}
                        </motion.section>
                    </div>

                    <div className="auth-erp-corner-version">
                        <APPVersion className="text-[var(--text-tertiary)]"/>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
