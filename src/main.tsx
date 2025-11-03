import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import 'font-awesome/css/font-awesome.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import 'react-toastify/dist/ReactToastify.css';
import './assets/theme/Theme.ts'

createRoot(document.getElementById('root')!).render(
    <App />
)
