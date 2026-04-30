import {useTheme} from "../../../app/providers/ThemeProvider.tsx";

export const ThemeToggle = () => {
    const {theme, toggleTheme} = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
            <span className="theme-toggle-thumb">
                <i className={`fa ${theme === "dark" ? "fa-moon" : "fa-sun"}`}/>
            </span>
            <span className="hidden sm:inline">{theme === "dark" ? "Oscuro" : "Claro"}</span>
        </button>
    );
};
