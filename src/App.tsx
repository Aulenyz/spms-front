import './App.css';
import {AuthProvider} from "./contexts/AuthContext.tsx";
import {CompanyProvider} from "./contexts/CompanyContext.tsx";
import {ToastContainer} from "react-toastify";
import {AppRouting} from "./AppRouting.tsx";
import {BrowserRouter} from "react-router-dom";
import {ThemeProvider} from "./app/providers/ThemeProvider.tsx";
import {GlobalErrorGuard} from "./modules/errors/GlobalErrorGuard.tsx";

const App = () => {

    return (
        <BrowserRouter>
            <ThemeProvider>
                <CompanyProvider>
                    <GlobalErrorGuard/>
                    <AuthProvider>
                        <AppRouting/>
                    </AuthProvider>
                </CompanyProvider>
            </ThemeProvider>
            <ToastContainer
                position="top-right"
                toastClassName="app-toast"
                style={{zIndex: 20000}}
            />
        </BrowserRouter>
    );
};

export default App
