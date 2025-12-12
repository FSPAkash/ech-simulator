import React, { useState } from 'react';
import './LoginPage.css';

// Import your logos here
import mainLogo from '../assets/logos/HT.png';
import huntsmanLogo from '../assets/logos/FS.png';

// Predefined users
const USERS = {
    'akash': {
        password: 'A1234',
        name: 'Akash',
        initials: 'AK',
    },
    'naina': {
        password: 'N123',
        name: 'Naina',
        initials: 'NB',
    },
    'admin': {
        password: 'A123',
        name: 'Admin',
        initials: 'AD',
    }
};

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);

        // Simulate authentication delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check credentials against predefined users
        const userKey = username.toLowerCase().trim();
        const user = USERS[userKey];

        if (user && user.password === password) {
            onLogin({
                username: userKey,
                name: user.name,
                initials: user.initials,
                role: user.role
            });
        } else {
            setError('Invalid username or password. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Animated Background */}
            <div className="login-background">
                <div className="background-gradient"></div>
                
                {/* Left Funnel */}
                <div className="particle-funnel particle-funnel-left">
                    <div className="particle-strip"></div>
                    <div className="particle-strip"></div>
                </div>
                
                {/* Right Funnel */}
                <div className="particle-funnel particle-funnel-right">
                    <div className="particle-strip"></div>
                    <div className="particle-strip"></div>
                </div>
            </div>

            {/* Top Accent */}
            <div className="login-accent-top"></div>

            {/* Main Content */}
            <div className="login-content">
                {/* Login Card */}
                <div className="login-card">
                    {/* Logo Section */}
                    <div className="login-logo-section">
                        <div className="login-logo">
                            <img 
                                src={mainLogo} 
                                alt="Logo" 
                                className="main-logo-img"
                            />
                        </div>
                        <h1>Price Scenario Simulator</h1>
                    </div>

                    {/* Login Form */}
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="login-error">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className={`login-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                </div>

                {/* Powered By Section */}
                <div className="powered-by-section">
                    <span className="powered-by-label">Powered by</span>
                    <a 
                        href="https://www.findability.ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="powered-by-logo"
                    >
                        <img 
                            src={huntsmanLogo} 
                            alt="Huntsman" 
                            className="huntsman-logo-img"
                        />
                    </a>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="login-accent-bottom"></div>
        </div>
    );
};

export default LoginPage;