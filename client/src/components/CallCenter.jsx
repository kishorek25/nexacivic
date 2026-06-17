import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Phone, User, FileText, MapPin, Tag, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CallCenter = ({ token }) => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        callerName: '',
        callerPhone: '8667-872782',
        title: '',
        description: '',
        category: '',
        location: '',
        priority: 'Medium'
    });
    const [submitting, setSubmitting] = useState(false);
    const [recentComplaints, setRecentComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(false);

    useEffect(() => {
        fetchRecentComplaints();
    }, []);

    const fetchRecentComplaints = async () => {
        setLoadingComplaints(true);
        try {
            const res = await axios.get('/api/callcenter/complaints');
            setRecentComplaints(res.data);
        } catch (err) {
            console.error('Failed to fetch recent complaints:', err);
        } finally {
            setLoadingComplaints(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.callerName || !form.callerPhone || !form.title || !form.description || !form.location) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post('/api/callcenter/complaint', form);
            toast.success(res.data.message || 'Complaint registered successfully via call center');
            
            // Reset form (keep default phone number)
            setForm({
                callerName: '',
                callerPhone: '8667-872782',
                title: '',
                description: '',
                category: '',
                location: '',
                priority: 'Medium'
            });
            
            // Refresh recent complaints
            fetchRecentComplaints();
        } catch (err) {
            console.error('Failed to register complaint:', err);
            toast.error(err.response?.data?.error || 'Failed to register complaint');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'Pending': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
            'In Progress': { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
            'Resolved': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
        };
        const style = colors[status] || colors['Pending'];
        return { background: style.bg, color: style.color };
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '1.5rem',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📞</div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700' }}>
                    Call Center Complaint Registration
                </h1>
                <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                    Register complaints received via phone calls
                </p>
            </div>

            {/* Form Card */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={20} />
                    Caller Information
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontWeight: '600' }}>
                                <User size={14} />
                                Caller Name *
                            </label>
                            <input
                                type="text"
                                name="callerName"
                                value={form.callerName}
                                onChange={handleChange}
                                placeholder="Enter caller's name"
                                required
                                className="input-modern"
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontWeight: '600' }}>
                                <Phone size={14} />
                                Phone Number *
                            </label>
                            <input
                                type="text"
                                name="callerPhone"
                                value={form.callerPhone}
                                onChange={handleChange}
                                placeholder="8667-872782"
                                required
                                className="input-modern"
                            />
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} />
                        Complaint Details
                    </h2>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontWeight: '600' }}>
                            <AlertCircle size={14} />
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Brief title of the issue"
                            required
                            className="input-modern"
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Detailed description of the complaint"
                            required
                            rows="3"
                            className="input-modern"
                            style={{ minHeight: '80px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontWeight: '600' }}>
                                <Tag size={14} />
                                Category
                            </label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className="input-modern"
                            >
                                <option value="">Select Category...</option>
                                <option value="Road">Road</option>
                                <option value="Garbage">Garbage</option>
                                <option value="Water">Water</option>
                                <option value="Streetlight">Streetlight</option>
                                <option value="Drainage">Drainage</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className="input-modern"
                            >
                                <option value="Low">Low Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="High">High Priority</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem', fontWeight: '600' }}>
                            <MapPin size={14} />
                            Location *
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="Full address of the issue"
                            required
                            className="input-modern"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: submitting ? 'rgba(79, 70, 229, 0.5)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {submitting ? (
                            <>
                                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
                                Registering...
                            </>
                        ) : (
                            <>
                                📞 Register Complaint
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Recent Call Center Complaints */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h2 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} />
                    Recent Call Center Complaints
                </h2>

                {loadingComplaints ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Loading...
                    </div>
                ) : recentComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No call center complaints registered yet.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Caller</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Title</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentComplaints.map((complaint) => (
                                    <tr key={complaint._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '600' }}>{complaint.callerName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{complaint.callerPhone}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '500' }}>{complaint.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{complaint.complaintId}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{complaint.location}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                ...getStatusBadge(complaint.status),
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.8rem',
                                                fontWeight: '600'
                                            }}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallCenter;
