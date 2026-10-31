import {Component, ErrorInfo, ReactNode} from "react";
import {ErrorScreen} from "../../modules/errors/components/ErrorScreen.tsx";

type Props = { children: ReactNode, resetKey?: string };
type State = { error?: unknown };

const isChunkLoadError = (error: unknown): boolean => {
    const message = String((error as { message?: string })?.message ?? error ?? "");
    return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically/i.test(message);
};

/**
 * Error de página completa para fallos a nivel de ruta (p. ej. no se pudo descargar el chunk de la pantalla
 * tras un nuevo despliegue, o un error de render). Los errores de datos se notifican con toast.
 */
export class RouteErrorBoundary extends Component<Props, State> {
    state: State = {};

    static getDerivedStateFromError(error: unknown): State {
        return {error};
    }

    componentDidCatch(error: unknown, info: ErrorInfo): void {
        console.error("Error al renderizar la ruta", error, info.componentStack);
    }

    componentDidUpdate(previous: Props): void {
        if (this.state.error && previous.resetKey !== this.props.resetKey) {
            this.setState({error: undefined});
        }
    }

    render(): ReactNode {
        if (!this.state.error) return this.props.children;
        const chunk = isChunkLoadError(this.state.error);
        return (
            <ErrorScreen
                code={chunk ? "503" : "500"}
                title={chunk ? "No se pudo cargar la pantalla" : "Problema interno del sistema"}
                icon="fa-triangle-exclamation"
                message={chunk
                    ? "Es posible que se haya publicado una nueva versión de la aplicación o que la conexión haya fallado."
                    : "Ocurrió un error mientras intentábamos mostrar esta pantalla."}
                hint="Recarga la página para intentarlo nuevamente."
                actions={[
                    {label: "Recargar", onClick: () => window.location.reload()},
                    {label: "Ir al inicio", to: "/home", variant: "light"},
                ]}
            />
        );
    }
}
