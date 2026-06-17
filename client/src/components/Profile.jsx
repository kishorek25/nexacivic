import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Lock, Edit3, Save, X, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const Profile = ({ user, token, onUpdateUser }) => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        mobile: '',
    });
    const [originalEmail, setOriginalEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Email Update State
    const [showOtpField, setShowOtpField] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/user/profile');
            setProfile({
                name: res.data.name,
                email: res.data.email,
                mobile: res.data.mobile
            });
            setOriginalEmail(res.data.email);
        } catch (err) {
            toast.error("Failed to fetch profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBasic = async (e) => {
        e.preventDefault();
        
        // If email is changed but not verified, we should warn
        if (profile.email !== originalEmail && !showOtpField) {
            handleSendOtp();
            return;
        }

        try {
            setLoading(true);
            const updateData = {
                name: profile.name,
                mobile: profile.mobile,
            };
            if (password) updateData.password = password;

            const res = await axios.put('/api/user/update', updateData);
            toast.success(res.data.message);
            setIsEditing(false);
            setPassword('');
            
            // Update the global user state in App.jsx if needed
            if (onUpdateUser) {
                onUpdateUser(res.data.user);
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        try {
            setOtpLoading(true);
            await axios.post('/api/user/send-email-update-otp', { newEmail: profile.email });
            toast.info("OTP sent to your new email address");
            setShowOtpField(true);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setOtpLoading(true);
            const res = await axios.post('/api/user/verify-email-update', { otp });
            toast.success(res.data.message);
            setOriginalEmail(res.data.email);
            setShowOtpField(false);
            setOtp('');
            
            // Re-fetch profile to sync everything
            fetchProfile();
        } catch (err) {
            toast.error(err.response?.data?.error || "Verification failed");
        } finally {
            setOtpLoading(false);
        }
    };

    if (loading && !profile.name) {
        return (
            <div className="loading-screen">
                <RefreshCw className="animate-spin" /> Fetching your profile...
            </div>
        );
    }

    return (
        <div className="profile-container animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                {/* Visual Decoration */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.3 }}></div>
                
                <div className="text-center mb-4">
                    <div className="profile-avatar-large" style={{ 
                        width: '80px', height: '80px', borderRadius: '50%', 
                        background: 'var(--gradient-neon)', margin: '0 auto 1.5rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: '800', color: '#fff',
                        boxShadow: 'var(--shadow-neon)'
                    }}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <h2 style={{ color: 'var(--text-h)', marginBottom: '0.5rem' }}>{isEditing ? 'Edit Profile' : 'Your Profile'}</h2>
                    {!isEditing && <span className="badge badge-inprogress" style={{ fontSize: '0.7rem' }}>{user?.role?.toUpperCase()} ACCOUNT</span>}
                </div>

                <form onSubmit={handleUpdateBasic}>
                    <div className="input-group">
                        <label><User size={14} style={{ marginRight: '8px' }} /> Full Name</label>
                        <input 
                            type="text" 
                            className="input-modern"
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            disabled={!isEditing}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label><Mail size={14} style={{ marginRight: '8px' }} /> Email Address</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="email" 
                                className="input-modern"
                                value={profile.email}
                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                disabled={!isEditing}
                                required
                            />
                            {isEditing && profile.email !== originalEmail && !showOtpField && (
                                <button 
                                    type="button" 
                                    className="btn-primary-mini" 
                                    onClick={handleSendOtp}
                                    disabled={otpLoading}
                                    style={{ whiteSpace: 'nowrap', width: 'auto', marginTop: 0 }}
                                >
                                    {otpLoading ? 'Sending...' : 'Verify Email'}
                                </button>
                            )}
                        </div>
                        {isEditing && profile.email !== originalEmail && !showOtpField && (
                            <small style={{ color: 'var(--warning)', marginTop: '5px', display: 'block' }}>
                                Changing email requires verification.
                            </small>
                        )}
                        {originalEmail === profile.email && !isEditing && (
                            <small style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                                <ShieldCheck size={12} /> Verified
                            </small>
                        )}
                    </div>

                    {showOtpField && (
                        <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--primary)', marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.05)' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem' }}>Enter 6-digit OTP sent to {profile.email}</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    className="input-modern" 
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                                <button 
                                    type="button" 
                                    className="btn-primary" 
                                    onClick={handleVerifyOtp}
                                    disabled={otpLoading || otp.length !== 6}
                                    style={{ width: 'auto', marginTop: 0, padding: '0 1.5rem' }}
                                >
                                    Verify
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label><Phone size={14} style={{ marginRight: '8px' }} /> Mobile Number</label>
                        <input 
                            type="text" 
                            className="input-modern"
                            value={profile.mobile}
                            onChange={(e) => setProfile({...profile, mobile: e.target.value})}
                            disabled={!isEditing}
                            required
                        />
                    </div>

                    {isEditing && (
                        <div className="input-group">
                            <label><Lock size={14} style={{ marginRight: '8px' }} /> New Password (leave blank to keep current)</label>
                            <input 
                                type="password" 
                                className="input-modern"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                        {!isEditing ? (
                            <button 
                                type="button" 
                                className="btn-primary" 
                                onClick={() => setIsEditing(true)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <Edit3 size={18} /> Edit Profile
                            </button>
                        ) : (
                            <>
                                <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    disabled={loading || (profile.email !== originalEmail && !showOtpField)}
                                    style={{ flex: 2, marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    <Save size={18} /> Update Profile
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-danger" 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setShowOtpField(false);
                                        fetchProfile();
                                    }}
                                    style={{ flex: 1, padding: '0.75rem', marginTop: 0, borderRadius: '12px' }}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </form>

                {isEditing && profile.email !== originalEmail && !showOtpField && (
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Note: You must verify your new email before saving other changes.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
