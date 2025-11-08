import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {UserOrganizationService} from "../../../services/user/UserOrganizationService.ts";
import {LoadingContent} from "../../../components/io/output/LoadingContent.tsx";
import {toast} from "react-toastify";
import {UserOrganizationDTO} from "../../../domain/model/user/UserOrganizationDTO.tsx";
import logo from "../../../assets/images/logo.png";
import {StorageItem} from "../../../domain/types/StorageItem.ts";

export const SelectOrganizationPage = () => {
    const [organizations, setOrganizations] = useState<UserOrganizationDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const response = await UserOrganizationService.instance.current();
                if (Array.isArray(response) && response.length > 0) {
                    if (response.length === 1 && response[0].organization) {
                        const org = response[0].organization;
                        localStorage.setItem(StorageItem.CompanyRNC, org.document);
                        navigate("/", {replace: true});
                        return;
                    }
                    setOrganizations(response);
                } else if (response?.organization) {
                    const org = response.organization;
                    localStorage.setItem(StorageItem.CompanyRNC, org.document);
                    console.log("RNC guardado automáticamente:", org.document);
                    navigate("/", {replace: true});
                } else {
                    toast.warning("No se encontró ninguna organización asociada.");
                }
            } catch (error) {
                toast.error("No se pudo cargar la organización.");
            } finally {
                setIsLoading(false);
            }
        };
        loadOrganizations();
    }, []);

    const handleSelect = (org: UserOrganizationDTO) => {
        if (!org?.organization) return;
        const selectedRnc = org.organization.document;
        localStorage.setItem(StorageItem.CompanyRNC, selectedRnc);
        const verificado = localStorage.getItem(StorageItem.CompanyRNC);
        if (verificado === selectedRnc) {
            navigate("/", {replace: true});
        } else {
            toast.error("Error al guardar el RNC. Intenta nuevamente.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fbff]">
                <LoadingContent loading={true} className="text-blue-600 text-6xl"/>
                <p className="text-gray-600 mt-3 font-medium">Cargando organizaciones...</p>
            </div>
        );
    }

    if (organizations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fbff] text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                    No se encontró ninguna organización
                </h2>
                <p className="text-gray-500 mb-6">
                    Comunícate con el administrador para obtener acceso.
                </p>
                <button
                    onClick={() => navigate("/auth/login")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all"
                >
                    Volver al inicio de sesión
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fbff] px-6 py-10">
            <img src={logo} alt="Logo" className="w-24 h-24 mb-4 opacity-90"/>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-10 text-center">
                Seleccione la Proveedor
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl w-full justify-center">
                {organizations.map((org) => (
                    <div
                        key={org.organization.id}
                        onClick={() => handleSelect(org)}
                        className="cursor-pointer bg-white shadow-md hover:shadow-xl border border-gray-100 rounded-2xl p-6 flex flex-col items-center transition-all duration-300 hover:scale-[1.02]"
                    >
                        <div
                            className="w-20 h-20 flex items-center justify-center rounded-full text-white text-2xl font-bold mb-4"
                            style={{
                                backgroundColor:
                                    "#" +
                                    Math.floor(Math.random() * 16777215)
                                        .toString(16)
                                        .padStart(6, "0"),
                            }}
                        >
                            {org.organization.name
                                .split(" ")
                                .map((w) => w.charAt(0))
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                        </div>

                        <h2 className="text-lg font-semibold text-gray-800 text-center">
                            {org.organization.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {org.organization.document}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Activa
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-sm text-gray-400 mt-10">Versión 0.0.1</p>
        </div>
    );
};
