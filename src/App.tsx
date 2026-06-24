import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute'; // Placeholder for now
import Board from './pages/Board'; // Placeholder

import { NotificationProvider } from './context/NotificationContext';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NotificationProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={
                            <ProtectedRoute>
                                <Board />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </NotificationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
