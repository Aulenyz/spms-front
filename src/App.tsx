import './App.css';
import {AuthProvider} from "./contexts/AuthContext.tsx";
import {ToastContainer} from "react-toastify";
import {AppRouting} from "./AppRouting.tsx";
import {BrowserRouter} from "react-router-dom";

const App = () => {

    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRouting/>
            </AuthProvider>
            <ToastContainer/>
        </BrowserRouter>
    );
};

export default App
