import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Logo from './common/Logo';

const Login = ({ setAuth, setToken }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('/api/login', credentials);

            // Save token and user details to localStorage
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            // Update global state
            setAuth(res.data.user);
            if (setToken) setToken(res.data.token);

            // Sync i18n language
            if (res.data.user.language) {
                i18n.changeLanguage(res.data.user.language);
            }

            // Redirect to dashboard
            navigate('/');
        } catch (err) {
            if (err.response) {
                // Server responded with an error status
                setError(err.response.data?.error || "Login failed");
            } else if (err.request) {
                // Request was made but no response received (Server down, CORS, etc.)
                setError("Network error: Could not reach the backend server. Is it running?");
            } else {
                // Something else happened
                setError("Configuration error: " + err.message);
            }
        }
    };

    const { t, i18n } = useTranslation();

    return (
        <div className="auth-container">
            <div className="form-container auth-form glass-panel animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Logo size={64} />
                </div>
                <h2>{t('loginTitle', 'Login to NexaCivic')}</h2>
                {error && <div className="error-alert">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>{t('email', 'Email')}</label>
                        <input type="email" name="email" value={credentials.email} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label>{t('password', 'Password')}</label>
                        <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn-primary">{t('login', 'Login')}</button>
                </form>
                <p className="auth-link">{t('noAccount', "Don't have an account?")} <Link to="/register">{t('registerHere', 'Register here')}</Link></p>
            </div>
        </div>
    );
};

export default Login;
