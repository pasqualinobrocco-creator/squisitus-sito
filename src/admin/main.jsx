import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { ToastProvider } from './ui.jsx';
import './admin.css';

createRoot(document.getElementById('root')).render(<ToastProvider><App /></ToastProvider>);
