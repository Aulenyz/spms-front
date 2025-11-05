import {Context, createContext, FC, ReactNode, useContext, useEffect, useState} from 'react';
import {Location, NavigateFunction, useLocation, useNavigate} from 'react-router-dom';
import {User} from '../domain/model/user/user.ts';
import {UserPasswordLogin} from '../domain/model/auth/Login.ts';
import {State, VOID} from '../domain/types/steoreotype.ts';
import {LocalStorage} from '../utils/LocalStorage.ts';
import {StorageItem} from '../domain/types/StorageItem.ts';
import {AuthService} from "../services/auth/AuthService.ts";

export type AuthProviderParam = { children: ReactNode };

const LOGIN_PATH: string = '/auth/login';
const SELECT_ORGANIZATION_PATH: string = '/auth/select-organization';

const authService: AuthService = AuthService.instance;

export interface AuthContextValue {
    current?: User,
    message?: string,
    loading?: boolean,
    logout?: VoidFunction,
    validating?: boolean,
    authenticated?: boolean,
    authenticate: (request: UserPasswordLogin) => void;
}

export const AuthContext: Context<AuthContextValue> = createContext<AuthContextValue>({
    authenticate: VOID
});

export const AuthProvider: FC<AuthProviderParam> = ({children}: AuthProviderParam) => {
    const {pathname}: Location = useLocation();
    const navigate: NavigateFunction = useNavigate();
    const [current, setCurrent]: State<User> = useState<User>();
    const [message, setMessage]: State<string> = useState<string>();
    const [loading, setLoading]: State<boolean> = useState<boolean>(false);
    const [validating, setValidating]: State<boolean> = useState<boolean>(true);

    useEffect((): void => {
        const isRouteValid: boolean = !pathname.startsWith('/auth/') && !pathname.startsWith('/errors/');
        isRouteValid && authService.currentUser().then(setCurrent, (): void => {
            setCurrent(undefined);
            navigate(LOGIN_PATH);
        }).finally(() => {
            setValidating(false);
        });
    }, [pathname, navigate]);

    const authenticate = ({username, password}: UserPasswordLogin): void => {
        setLoading(true);
        setMessage(undefined);
        LocalStorage.remove(StorageItem.RecentSearches);
        authService.authenticate(username, password).then((): void => {
            authService.currentUser().then((employee: User): void => {
                setCurrent(employee);
                navigate(SELECT_ORGANIZATION_PATH, {replace: true});
            });
        }, (): void => {
            setMessage('Usuario o contraseña incorrecto.');
        }).finally((): void => {
            setLoading(false);
        });
    };

    const logout = (): void => {
        authService.logout();
        setCurrent(undefined);
        navigate(LOGIN_PATH, {replace: true});
    };

    const providerValue: AuthContextValue = {
        logout,
        current,
        loading,
        validating,
        message,
        authenticate,
        authenticated: current !== undefined
    };

    return (
        <AuthContext.Provider value={providerValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    return useContext(AuthContext);
};
