import {Context, createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Location, NavigateFunction, useLocation, useNavigate} from 'react-router-dom';
import {useQueryClient} from "@tanstack/react-query";
import {User} from '../domain/model/user/user.ts';
import {UserPasswordLogin} from '../domain/model/auth/Login.ts';
import {State, VOID} from '../domain/types/steoreotype.ts';
import {LocalStorage} from '../utils/LocalStorage.ts';
import {StorageItem} from '../domain/types/StorageItem.ts';
import {AuthService} from "../services/auth/AuthService.ts";
import {BaseService, readCompanyId} from "../services/BaseService.ts";
import {AuthToken, TokenInfo} from "../domain/model/auth/Token.ts";
import {useCompany} from "./CompanyContext.tsx";
import {resolveErrorPath} from "../modules/errors/resolveErrorPath.ts";

export type AuthProviderParam = { children: ReactNode };

const LOGIN_PATH: string = '/auth/login';
const SELECT_ORGANIZATION_PATH: string = '/auth/select-organization';

const authService: AuthService = AuthService.instance;

/** Rutas que requieren sesión (todo excepto /auth/* y /errors/*). */
const isProtectedRoute = (pathname: string): boolean =>
    !pathname.startsWith('/auth/') && !pathname.startsWith('/errors/');

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
    const queryClient = useQueryClient();
    const {setRnc, clearRnc} = useCompany();
    const [current, setCurrent]: State<User> = useState<User>();
    const [tokenInfo, setTokenInfo]: State<TokenInfo> = useState<TokenInfo>(authService.getTokenInfo());
    const [message, setMessage]: State<string> = useState<string>();
    const [loading, setLoading]: State<boolean> = useState<boolean>(false);
    const [validating, setValidating]: State<boolean> = useState<boolean>(true);
    /** Token que ya fue validado contra el servidor (GET /auth/current). */
    const validatedToken = useRef<string | undefined>(undefined);

    const resetSession = useCallback((): void => {
        authService.clearSession();
        validatedToken.current = undefined;
        setCurrent(undefined);
        setTokenInfo(authService.getTokenInfo());
    }, []);

    // 401 de la API: limpia la sesión y vuelve al login sin recargar la página.
    useEffect(() => {
        BaseService.unauthorizedHandler = (): void => {
            resetSession();
            queryClient.clear();
            if (!window.location.pathname.startsWith('/auth/')) {
                navigate(LOGIN_PATH, {replace: true});
            }
        };
    }, [navigate, queryClient, resetSession]);

    // Chequeo barato y síncrono en cada navegación: solo se verifica que exista un token usable.
    useEffect((): void => {
        if (pathname === LOGIN_PATH) {
            resetSession();
        }
        if (!isProtectedRoute(pathname)) {
            setValidating(false);
            return;
        }
        if (!authService.hasUsableToken()) {
            resetSession();
            setValidating(false);
            navigate(LOGIN_PATH, {replace: true});
        }
    }, [pathname, navigate, resetSession]);

    // Validación contra el servidor: una vez al montar (o cuando cambia el token) en una ruta protegida.
    const protectedRoute: boolean = isProtectedRoute(pathname);
    const token: string = tokenInfo?.token ?? '';
    useEffect((): void => {
        if (!protectedRoute || !authService.hasUsableToken()) return;
        const storedToken: string = authService.getTokenInfo().token;
        if (validatedToken.current === storedToken) return;
        validatedToken.current = storedToken;
        setValidating(true);

        authService.currentUser().then(async (user): Promise<void> => {
            setCurrent(user);
            const currentToken: AuthToken = authService.current;
            if (readCompanyId() && (!currentToken.authorities || currentToken.authorities.length === 0)) {
                try {
                    const refreshed = await authService.refreshToken();
                    validatedToken.current = refreshed.token;
                    setTokenInfo(refreshed);
                } catch (error) {
                    const errorPath = resolveErrorPath(error as { status?: number });
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
            validatedToken.current = undefined;
            const errorPath = resolveErrorPath(error as { status?: number });
            if (errorPath) {
                navigate(errorPath, {replace: true});
                return;
            }
            setCurrent(undefined);
            navigate(LOGIN_PATH);
        }).finally(() => {
            setValidating(false);
        });
    }, [protectedRoute, token, navigate]);

    const authenticate = useCallback(({username, password}: UserPasswordLogin): void => {
        setLoading(true);
        setMessage(undefined);
        LocalStorage.remove(StorageItem.RecentSearches);
        authService.authenticate(username, password).then((): void => {
            setTokenInfo(authService.getTokenInfo());
            navigate(SELECT_ORGANIZATION_PATH, {replace: true});
        }, (error): void => {
            const errorPath = resolveErrorPath(error as { status?: number });
            if (errorPath) {
                navigate(errorPath, {replace: true});
                return;
            }
            setMessage('Usuario o contraseña incorrecto.');
        }).finally((): void => {
            setLoading(false);
        });
    }, [navigate]);

    const refreshToken = useCallback(async (): Promise<TokenInfo> => {
        const refreshed = await authService.refreshToken();
        setTokenInfo(refreshed);
        return refreshed;
    }, []);

    const switchOrganization = useCallback(async (organizationId: string): Promise<TokenInfo> => {
        await queryClient.cancelQueries();
        setRnc(organizationId);
        const refreshed = await authService.refreshToken();
        const user = await authService.currentUser();
        validatedToken.current = refreshed.token;
        setTokenInfo(refreshed);
        setCurrent(user);
        // Los datos en caché pertenecen a la organización anterior: se descartan y se recargan los activos.
        void queryClient.resetQueries();
        return refreshed;
    }, [queryClient, setRnc]);

    const authorities: string[] = useMemo(() => tokenInfo?.info?.authorities ?? [], [tokenInfo]);

    const hasAuthority = useCallback((authority?: string): boolean => {
        if (!authority) return true;
        return authorities.includes(authority);
    }, [authorities]);

    const logout = useCallback((): void => {
        authService.logout();
        clearRnc();
        queryClient.clear();
        validatedToken.current = undefined;
        setCurrent(undefined);
        setTokenInfo(authService.getTokenInfo());
        navigate(LOGIN_PATH, {replace: true});
    }, [clearRnc, navigate, queryClient]);

    const providerValue: AuthContextValue = useMemo(() => ({
        logout,
        current,
        tokenInfo,
        loading,
        validating,
        message,
        authorities,
        refreshToken,
        switchOrganization,
        hasAuthority,
        authenticate,
        authenticated: current !== undefined
    }), [logout, current, tokenInfo, loading, validating, message, authorities, refreshToken, switchOrganization, hasAuthority, authenticate]);

    return (
        <AuthContext.Provider value={providerValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    return useContext(AuthContext);
};
