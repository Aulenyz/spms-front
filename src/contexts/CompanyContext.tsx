import {createContext, FC, ReactNode, useContext, useEffect, useState} from "react";
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
    const [rnc, setRncState] = useState<string | undefined>(undefined);

    useEffect(() => {
        const storedRnc = localStorage.getItem(StorageItem.CompanyRNC);
        if (storedRnc) {
            setRncState(storedRnc);
        }
    }, []);

    const setRnc = (value: string) => {
        localStorage.setItem(StorageItem.CompanyRNC, value);
        setRncState(value);
    };

    const clearRnc = () => {
        localStorage.removeItem(StorageItem.CompanyRNC);
        setRncState(undefined);
    };

    return (
        <CompanyContext.Provider value={{rnc, setRnc, clearRnc}}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
