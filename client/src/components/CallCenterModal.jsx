import React, { useEffect } from 'react';
import { Phone, X, FileText, User, MapPin, Tag, AlertTriangle, CheckCircle, Copy, ArrowRight } from 'lucide-react';

const CallCenterModal = ({ isOpen, onClose }) => {
    const CALL_CENTER_NUMBER = '8667-872782';

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const requiredInfo = [
        { icon: User, text: 'Your Name', placeholder: 'Full name as per records' },
        { icon: Phone, text: 'Phone Number', placeholder: 'Active contact number' },
        { icon: FileText, text: 'Issue Title', placeholder: 'Brief summary (e.g., Pothole on Main Street)' },
        { icon: FileText, text: 'Detailed Description', placeholder: 'Describe the issue in detail' },
        { icon: MapPin, text: 'Location/Address', placeholder: 'Full address where issue exists' },
        { icon: Tag, text: 'Category', placeholder: 'Road, Water, Garbage, Streetlight, etc.' },
    ];

    const handleCopyNumber = () => {
        navigator.clipboard.writeText(CALL_CENTER_NUMBER.replace(/-/g, ''));
    };

    const handleCall = () => {
        window.location.href = `tel:${CALL_CENTER_NUMBER.replace(/-/g, '')}`;
    };

    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    width: '100%',
                    maxWidth: '480px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                    padding: '1.5rem',
                    position: 'relative'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '18px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        ✕
                    </button>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📞</div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff' }}>
                        Report via Call Center
                    </h2>
                    <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.85rem', color: '#fff' }}>
                        Call our helpline to register your complaint
                    </p>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {/* Phone Number Section */}
                    <div style={{
                        background: '#f9fafb',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        border: '1px solid #e5e7eb'
                    }}>
                        <p style={{ margin: '0 0 0.5rem', color: '#6b7280', fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Call Center Number
                        </p>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            marginBottom: '1rem'
                        }}>
                            <span style={{
                                fontSize: '1.6rem',
                                fontWeight: '700',
                                color: '#1f2937',
                                letterSpacing: '0.02em'
                            }}>
                                📞 {CALL_CENTER_NUMBER}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button
                                onClick={handleCall}
                                style={{
                                    flex: 1,
                                    padding: '0.875rem 1.25rem',
                                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                                }}
                            >
                                <Phone size={18} />
                                Call Now
                            </button>
                            <button
                                onClick={handleCopyNumber}
                                style={{
                                    padding: '0.875rem 1.25rem',
                                    background: '#fff',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Copy size={16} />
                                Copy
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{
                            margin: '0 0 0.75rem',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                            Information to Have Ready
                        </h3>
                        <p style={{
                            margin: '0 0 1rem',
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            lineHeight: 1.6
                        }}>
                            When calling, please provide the following information so our staff can register your complaint quickly:
                        </p>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem'
                        }}>
                            {requiredInfo.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: '#f9fafb',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(6, 182, 212, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#06b6d4',
                                        flexShrink: 0
                                    }}>
                                        <item.icon size={16} />
                                    </div>
                                    <div>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            color: '#374151',
                                            fontWeight: '600',
                                            display: 'block'
                                        }}>
                                            {item.text}
                                        </span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#9ca3af',
                                            display: 'block'
                                        }}>
                                            {item.placeholder}
                                        </span>
                                    </div>
                                    <ArrowRight size={14} style={{ color: '#d1d5db', marginLeft: 'auto', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start'
                    }}>
                        <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{
                                margin: 0,
                                fontSize: '0.8rem',
                                color: '#059669',
                                fontWeight: '600'
                            }}>
                                Working Hours
                            </p>
                            <p style={{
                                margin: '0.25rem 0 0',
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                lineHeight: 1.5
                            }}>
                                Available Mon-Sat, 9 AM - 6 PM. For emergencies outside hours, leave a voicemail and we'll call you back.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallCenterModal;
