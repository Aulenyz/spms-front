import {Link} from 'react-router-dom'

export const Error404 = () => {
    return (
        <>
            <h1 className='fw-bolder fs-2hx text-gray-900 mb-4'>Página No Encontrada</h1>
            <div className='fw-semibold fs-6 text-gray-500 mb-7'>La página solicitada no pudo ser encontrada. <br/>Puede
                deberse a que haya sido movida a otra ruta o removida.
            </div>
            <div className='mb-3'>
                <img
                    src={'ok'}
                    className='mw-100 mh-300px theme-light-show'
                    alt='Missing image'
                />
                <img
                    src={'pkl'}
                    className='mw-100 mh-300px theme-dark-show'
                    alt='Missing IMage'
                />
            </div>
            <div className='mb-0'>
                <Link to='/' className='btn btn-sm btn-primary'>
                    Return Home
                </Link>
            </div>
            {/* end::Link */}
        </>
    )
}
