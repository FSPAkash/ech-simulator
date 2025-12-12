import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

const App = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('ech_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('ech_user');
            }
        }
        setIsLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('ech_user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('ech_user');
    };

    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;