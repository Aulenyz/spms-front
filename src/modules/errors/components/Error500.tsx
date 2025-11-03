import {Link} from 'react-router-dom'

export const Error500 = () => {
    return (
        <>
            <h1 className='fw-bolder fs-2qx text-gray-900 mb-4'>System Error</h1>
            <div className='fw-semibold fs-6 text-gray-500 mb-7'>
                Something went wrong! Please try again later.
            </div>
            <div className='mb-11'>
                <img src={''} className='mw-100 mh-300px theme-light-show' alt='Missing'/>
                <img src={'e'} className='mw-100 mh-300px theme-dark-show' alt='Missing'/>
            </div>
            <div className='mb-0'>
                <Link to='/dashboard' className='btn btn-sm btn-primary'>
                    Return Home
                </Link>
            </div>
        </>
    )
}
