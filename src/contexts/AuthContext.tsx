import {Context, createContext, FC, ReactNode, useContext, useEffect, useState} from 'react';
import {Location, NavigateFunction, useLocation, useNavigate} from 'react-router-dom';
import {User} from '../domain/model/user/user.ts';
import {UserPasswordLogin} from '../domain/model/auth/Login.ts';
import {State, VOID} from '../domain/types/steoreotype.ts';
import {LocalStorage} from '../utils/LocalStorage.ts';
import {StorageItem} from '../domain/types/StorageItem.ts';
import {AuthService} from "../services/auth/AuthService.ts";
import {AuthToken, TokenInfo} from "../domain/model/auth/Token.ts";
import {useCompany} from "./CompanyContext.tsx";
import {resolveErrorPath} from "../modules/errors/resolveErrorPath.ts";

export type AuthProviderParam = { children: ReactNode };

const LOGIN_PATH: string = '/auth/login';
const SELECT_ORGANIZATION_PATH: string = '/auth/select-organization';

const authService: AuthService = AuthService.instance;

export interface AuthContextValue {
    current?: User,
    tokenInfo?: TokenInfo,
    message?: string,
    loading?: boolean,
    logout?: VoidFunction,
    validating?: boolean,
    authenticated?: boolean,
    authorities: string[];
    refreshToken: () => Promise<TokenInfo>;
    switchOrganization: (organizationId: string) => Promise<TokenInfo>;
    hasAuthority: (authority?: string) => boolean;
    authenticate: (request: UserPasswordLogin) => void;
}

export const AuthContext: Context<AuthContextValue> = createContext<AuthContextValue>({
    authenticate: VOID,
    refreshToken: async () => authService.getTokenInfo(),
    switchOrganization: async () => authService.getTokenInfo(),
    hasAuthority: () => false,
    authorities: [],
});

export const AuthProvider: FC<AuthProviderParam> = ({children}: AuthProviderParam) => {
    const {pathname}: Location = useLocation();
    const navigate: NavigateFunction = useNavigate();
    const {setRnc} = useCompany();
    const [current, setCurrent]: State<User> = useState<User>();
    const [tokenInfo, setTokenInfo]: State<TokenInfo> = useState<TokenInfo>(authService.getTokenInfo());
    const [message, setMessage]: State<string> = useState<string>();
    const [loading, setLoading]: State<boolean> = useState<boolean>(false);
    const [validating, setValidating]: State<boolean> = useState<boolean>(true);

    useEffect((): void => {
        const isRouteValid: boolean = !pathname.startsWith('/auth/') && !pathname.startsWith('/errors/');
        if (!isRouteValid) {
            setValidating(false);
            return;
        }

        authService.currentUser().then(async (user): Promise<void> => {
            setCurrent(user);
            const companyRNC = localStorage.getItem(StorageItem.CompanyRNC);
            const currentToken: AuthToken = authService.current;
            if (companyRNC && (!currentToken.authorities || currentToken.authorities.length === 0)) {
                try {
                    const refreshed = await authService.refreshToken();
                    setTokenInfo(refreshed);
                } catch (error) {
                    const errorPath = resolveErrorPath(error as {status?: number});
                    if (errorPath) {
                        navigate(errorPath, {replace: true});
                        return;
                    }
                    setCurrent(undefined);
                    navigate(LOGIN_PATH, {replace: true});
                }
                return;
            }
            setTokenInfo(authService.getTokenInfo());
        }, (error): void => {
            const errorPath = resolveErrorPath(error as {status?: number});
            if (errorPath) {
                navigate(errorPath, {replace: true});
                return;
            }
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
            setTokenInfo(authService.getTokenInfo());
            authService.currentUser().then((employee: User): void => {
                setCurrent(employee);
                navigate(SELECT_ORGANIZATION_PATH, {replace: true});
            }, (error): void => {
                const errorPath = resolveErrorPath(error as {status?: number});
                if (errorPath) {
                    navigate(errorPath, {replace: true});
                    return;
                }
                setMessage('No se pudo cargar la sesión.');
            });
        }, (error): void => {
            const errorPath = resolveErrorPath(error as {status?: number});
            if (errorPath) {
                navigate(errorPath, {replace: true});
                return;
            }
            setMessage('Usuario o contraseña incorrecto.');
        }).finally((): void => {
            setLoading(false);
        });
    };

    const refreshToken = async (): Promise<TokenInfo> => {
        const refreshed = await authService.refreshToken();
        setTokenInfo(refreshed);
        return refreshed;
    };

    const switchOrganization = async (organizationId: string): Promise<TokenInfo> => {
        localStorage.setItem(StorageItem.CompanyRNC, organizationId);
        setRnc(organizationId);
        const refreshed = await refreshToken();
        const user = await authService.currentUser();
        setCurrent(user);
        return refreshed;
    };

    const hasAuthority = (authority?: string): boolean => {
        if (!authority) return true;
        const granted = tokenInfo?.info?.authorities ?? [];
        return granted.includes(authority);
    };

    const logout = (): void => {
        authService.logout();
        setCurrent(undefined);
        setTokenInfo(authService.getTokenInfo());
        navigate(LOGIN_PATH, {replace: true});
    };

    const providerValue: AuthContextValue = {
        logout,
        current,
        tokenInfo,
        loading,
        validating,
        message,
        authorities: tokenInfo?.info?.authorities ?? [],
        refreshToken,
        switchOrganization,
        hasAuthority,
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
