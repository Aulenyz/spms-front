import { Link } from "react-router-dom";

export const Error403 = () => {
    return (
        <>
            <h1 className="fw-bolder fs-2hx text-gray-900 mb-4">Acceso Denegado</h1>
            <div className="fw-semibold fs-6 text-gray-500 mb-7">
                No tiene permisos suficientes para acceder a esta página. <br />
                Si cree que esto es un error, contacte al administrador del sistema.
            </div>

            <div className="mb-3">
                <img
                    src={"njknk"}
                    className="mw-100 mh-300px theme-light-show"
                    alt="Acceso denegado"
                />
                <img
                    src={"gjhvhjv"}
                    className="mw-100 mh-300px theme-dark-show"
                    alt="Acceso denegado"
                />
            </div>

            <div className='mb-0'>
                <Link to='/' className='btn btn-sm btn-primary'>
                    Return Home
                </Link>
            </div>
        </>
    );
};
