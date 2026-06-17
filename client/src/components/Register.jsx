import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Logo from './common/Logo';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Info, 2: OTP Verification
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Timer state
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);

    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Handle Countdown
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await axios.post('/api/otp/send-email-otp', form);
            setMessage(res.data.message);
            setStep(2);
            setTimer(60); // 60 seconds countdown
            setCanResend(false);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('/api/otp/verify-email-otp', { email: form.email, otp });
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || "OTP verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="form-container auth-form glass-panel animate-fade-in">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Logo size={64} />
                </div>
                <h2>{t('registerTitle', 'Create an Account')}</h2>
                
                {error && <div className="error-alert">{error}</div>}
                {message && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', textAlign: 'center' }}>{message}</div>}

                {step === 1 ? (
                    <form onSubmit={handleSendOTP}>
                        <div className="input-group">
                            <label>{t('fullName', 'Full Name')}</label>
                            <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Enter your full name" />
                        </div>
                        <div className="input-group">
                            <label>{t('emailAddress', 'Email Address')}</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="example@email.com" />
                        </div>
                        <div className="input-group">
                            <label>📱 {t('mobileNumber', 'Mobile Number')}</label>
                            <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} required pattern="[0-9]{10}" placeholder="10-digit mobile number" />
                        </div>
                        <div className="input-group">
                            <label>{t('password', 'Password')}</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Choose a strong password" />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Processing..." : "Next: Verify Email"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>We sent a 6-digit OTP to **{form.email}**</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>(Please check your inbox and spam folder 📩)</p>
                        </div>
                        <div className="input-group">
                            <label>Enter 6-Digit OTP</label>
                            <input 
                                type="text" 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                                required 
                                placeholder="000000"
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Verifying..." : "Verify & Create Account"}
                        </button>
                        
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            {canResend ? (
                                <button type="button" onClick={handleSendOTP} className="btn-ghost" style={{ fontSize: '0.9rem' }}>
                                    Resend OTP
                                </button>
                            ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resend OTP in {timer}s</span>
                            )}
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ width: '100%', marginTop: '1rem', color: 'var(--text-muted)' }}>
                            Back to Details
                        </button>
                    </form>
                )}

                <p className="auth-link">{t('alreadyHaveAccount', "Already have an account?")} <Link to="/login">{t('loginHere', 'Login here')}</Link></p>
            </div>
        </div>
    );
};

export default Register;
