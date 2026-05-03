import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
};

const STORAGE_KEY = "spms-theme";
// Temporary product decision: force light mode regardless of system/user preference.
// Flip to `false` to re-enable dark mode using the stored/system value.
const FORCE_LIGHT_MODE = true;

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    toggleTheme: () => undefined,
    setTheme: () => undefined,
});

const resolveInitialTheme = (): ThemeMode => {
    if (FORCE_LIGHT_MODE) return "light";
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({children}: { children: ReactNode }) => {
    const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme);

    useEffect(() => {
        const effectiveTheme: ThemeMode = FORCE_LIGHT_MODE ? "light" : theme;

        document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
        document.documentElement.dataset.theme = effectiveTheme;
        document.documentElement.style.colorScheme = effectiveTheme;
        window.localStorage.setItem(STORAGE_KEY, effectiveTheme);

        if (FORCE_LIGHT_MODE && theme !== "light") {
            // Keep state consistent to avoid consumers thinking we're in dark mode.
            setTheme("light");
        }
    }, [theme]);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        setTheme,
        toggleTheme: () => {
            if (FORCE_LIGHT_MODE) return;
            setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
        },
    }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
