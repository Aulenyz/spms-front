import {useEffect, useState} from "react";
import {State} from "../../domain/types/steoreotype.ts";
import {UserService} from "../../services/user/UserService.ts";
import {Page, Pagination} from "../../domain/filters/Page.ts";
import {User, UserStatus} from "../../domain/model/user/user.ts";
import {Pager} from "../../components/io/input/Pager.tsx";
import {toast} from "react-toastify";

const userService: UserService = UserService.instance;

export const UserListPage = () => {
    const [pagination, setPagination]: State<Pagination> = useState(Pagination.first);
    const [users, setUsers]: State<Page<User>> = useState(Pagination.empty<User>());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [pagination]);

    const loadUsers = () => {
        setLoading(true);
        userService.getAll({}, pagination)
            .then(setUsers)
            .catch(() => toast.error("Error cargando los usuarios"))
            .finally(() => setLoading(false));
    };

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({...prev, page}));
    };

    const handleResendInvitation = async (email: string) => {
        try {
            await userService.resendInvitation(email);
            toast.success("Invitación reenviada exitosamente");
        } catch (error) {
            toast.error("Error al reenviar la invitación");
        }
    };

    const handleInvite = async () => {
        // Aquí puedes agregar lógica para abrir un modal de invitación
        toast.info("Funcionalidad de invitar usuario - Por implementar");
    };

    const getStatusBadge = (status: UserStatus) => {
        const statusConfig = {
            [UserStatus.ACTIVE]: { label: "ACTIVO", className: "bg-green-100 text-green-800" },
            [UserStatus.INACTIVE]: { label: "INACTIVO", className: "bg-gray-100 text-gray-800" },
            [UserStatus.CANCELLED]: { label: "CANCELADO", className: "bg-red-100 text-red-800" },
        };

        const config = statusConfig[status] || statusConfig[UserStatus.INACTIVE];
        return (
            <span className={`px-2 py-1 text-xs font-semibold rounded ${config.className}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="pt-6 pl-9 pr-5">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <i className="fa fa-users text-blue-600"></i>
                    Listado de Usuarios
                </h1>
            </div>

            <div className="card relative overflow-x-auto mb-6 border border-gray-200 rounded-md shadow-sm">
                <div className="card-header flex-wrap gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 rounded-t-md flex justify-between items-center">
                    <h3 className="card-title font-medium text-sm">
                        Usuarios del sistema
                    </h3>
                    <button
                        onClick={handleInvite}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2"
                    >
                        <i className="fa fa-envelope"></i>
                        INVITAR
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <i className="fa fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Cargando usuarios...</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-[5%]"></th>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Correo</th>
                                <th scope="col" className="px-6 py-3">Rol de usuario</th>
                                <th scope="col" className="px-6 py-3">Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {users.content.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No hay usuarios disponibles
                                    </td>
                                </tr>
                            ) : (
                                users.content.map((user: User, index: number) => (
                                    <tr key={index}
                                        className="bg-white border-b last:border-b-0 hover:bg-gray-50 transition">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="text-green-600 hover:text-green-800 transition"
                                                    title="Editar"
                                                >
                                                    <i className="fa fa-pencil"></i>
                                                </button>
                                                {user.status === UserStatus.INACTIVE && (
                                                    <button
                                                        onClick={() => handleResendInvitation(user.email)}
                                                        className="text-orange-600 hover:text-orange-800 transition"
                                                        title="Reenviar invitación"
                                                    >
                                                        <i className="fa fa-paper-plane"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {user.info?.name || user.info?.firstname + " " + user.info?.lastname || "NO DISPONIBLE"}
                                        </td>
                                        <td className="px-6 py-3">{user.email}</td>
                                        <td className="px-6 py-3">{user.role?.name || "N/A"}</td>
                                        <td className="px-6 py-3">
                                            {getStatusBadge(user.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>

                        {users.content.length > 0 && (
                            <div>
                                <Pager onChange={handlePageChange} page={users}/>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

