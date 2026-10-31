import {createContext, FC, ReactNode, useCallback, useContext, useMemo, useState} from "react";
import {readCompanyId} from "../services/BaseService.ts";
import {StorageItem} from "../domain/types/StorageItem.ts";

export interface CompanyContextValue {
    rnc?: string;
    setRnc: (rnc: string) => void;
    clearRnc: () => void;
}

const CompanyContext = createContext<CompanyContextValue>({
    rnc: undefined,
    setRnc: () => {
    },
    clearRnc: () => {
    },
});

export const CompanyProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [rnc, setRncState] = useState<string | undefined>(() => readCompanyId() || undefined);

    const setRnc = useCallback((value: string) => {
        localStorage.setItem(StorageItem.CompanyRNC, value);
        setRncState(value);
    }, []);

    const clearRnc = useCallback(() => {
        localStorage.removeItem(StorageItem.CompanyRNC);
        setRncState(undefined);
    }, []);

    const value = useMemo(() => ({rnc, setRnc, clearRnc}), [rnc, setRnc, clearRnc]);

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
