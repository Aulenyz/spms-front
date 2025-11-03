import { APPVersion } from "../../../components/io/output/shared/APPVersion.tsx";
import { SendRecoverSchema } from "./SendRecoverPasswordForm.tsx";
import { Link } from "react-router-dom";
import logo from "../../../assets/images/logo.png";

export const SendRecoverPasswordPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-100 to-blue-200 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-500 relative">

            {/* Botón de volver */}
            <Link
                to="/auth/login"
                className="absolute top-5 left-5 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
                <i className="fas fa-arrow-left mr-2"></i> Volver
            </Link>

            <div className="grid lg:grid-cols-2 w-full max-w-6xl h-[90vh] lg:h-[85vh] bg-white dark:bg-gray-950 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 backdrop-blur-sm">

                {/* Panel Izquierdo - Formulario */}
                <div className="flex items-center justify-center p-10 lg:p-14">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">
                                Recuperar contraseña
                            </h1>
                            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                Ingresa tu nombre de usuario para recibir un correo con las instrucciones de recuperación.
                            </p>
                        </div>
                        <SendRecoverSchema />
                    </div>
                </div>

                {/* Panel Derecho - Branding */}
                <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 text-white px-10 py-20 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('/textures/pattern.svg')] bg-cover bg-center"></div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <img
                            src={logo}
                            alt="Logo escolar"
                            className="w-48 lg:w-56 h-auto mb-4 drop-shadow-lg"
                        />

                        <h2 className="text-3xl font-bold leading-tight drop-shadow-md">
                            ¿Olvidaste tu contraseña?
                        </h2>
                        <p className="text-lg font-medium leading-relaxed text-blue-100 max-w-md">
                            No te preocupes 💡<br />
                            Nuestro sistema te ayudará a recuperar el acceso de forma rápida y segura.
                        </p>
                    </div>
                </div>
            </div>

            <APPVersion className="fixed bottom-3 left-3 text-xs text-gray-500 dark:text-gray-400" />
        </div>
    );
};
