import './App.css';
import {AuthProvider} from "./contexts/AuthContext.tsx";
import {ToastContainer} from "react-toastify";
import {AppRouting} from "./AppRouting.tsx";
import {BrowserRouter} from "react-router-dom";
import {ThemeProvider} from "./app/providers/ThemeProvider.tsx";

const App = () => {

    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <AppRouting/>
                </AuthProvider>
            </ThemeProvider>
            <ToastContainer/>
        </BrowserRouter>
    );
};

export default App
