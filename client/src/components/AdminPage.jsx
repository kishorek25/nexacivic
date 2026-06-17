import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import ComplaintList from './ComplaintList';
import ComplaintCard from './ComplaintCard';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminAnalytics from './AdminAnalytics';
import AdminHeatmap from './AdminHeatmap';
import DepartmentPerformance from './DepartmentPerformance';
import ZoneManagement from './ZoneManagement';
import { Phone, Users, MapPin } from 'lucide-react';

const AdminPage = ({ complaints, fetchComplaints, token, user, loading }) => {
    const [staffList, setStaffList] = useState([]);
    const [zones, setZones] = useState([]);
    const [showCallCenterOnly, setShowCallCenterOnly] = useState(false);
    const [showZoneManagement, setShowZoneManagement] = useState(false);
    const [callCenterComplaints, setCallCenterComplaints] = useState([]);

    useEffect(() => {
        if (user && user.role === 'admin' && token) {
            axios.get('/api/staff')
                .then(res => setStaffList(res.data))
                .catch(err => console.error("Could not fetch staff", err));
            
            fetchCallCenterComplaints();
            fetchZones();
        }
    }, [user, token]);

    const fetchZones = async () => {
        try {
            const res = await axios.get('/api/zones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones(res.data);
        } catch (err) {
            console.error("Failed to fetch zones:", err);
        }
    };

    const fetchCallCenterComplaints = async () => {
        try {
            const res = await axios.get('/api/callcenter/complaints');
            setCallCenterComplaints(res.data);
        } catch (err) {
            console.error("Failed to fetch call center complaints", err);
        }
    };

    const callCenterStats = {
        total: callCenterComplaints.length,
        pending: callCenterComplaints.filter(c => c.status === 'Pending').length,
        inProgress: callCenterComplaints.filter(c => c.status === 'In Progress').length,
        resolved: callCenterComplaints.filter(c => c.status === 'Resolved').length,
    };

    const displayedComplaints = showCallCenterOnly ? callCenterComplaints : complaints;

    return (
        <div className="admin-page animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center' }}>
                Admin Portal
            </h2>
            
            <Dashboard complaints={complaints} />
            <AdminAnalytics complaints={complaints} />
            <DepartmentPerformance token={token} />
            <AdminHeatmap token={token} />

            {/* Call Center Section */}
            <div style={{ 
                marginTop: '2rem',
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.05))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📞 Call Center Complaints
                        <span style={{
                            background: '#2563eb',
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '0.85rem'
                        }}>
                            {callCenterStats.total}
                        </span>
                    </h3>
                    <button 
                        onClick={() => setShowCallCenterOnly(!showCallCenterOnly)}
                        className="btn-ghost"
                        style={{ 
                            fontSize: '0.85rem', 
                            padding: '8px 16px',
                            background: showCallCenterOnly ? 'rgba(37, 99, 235, 0.2)' : 'var(--glass-bg)',
                            border: showCallCenterOnly ? '1px solid #2563eb' : '1px solid var(--glass-border)',
                            color: showCallCenterOnly ? '#3b82f6' : 'var(--text-primary)'
                        }}
                    >
                        {showCallCenterOnly ? '📋 Show All' : '📞 Show Call Center Only'}
                    </button>
                </div>

                {/* Call Center Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>{callCenterStats.total}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</div>
                    </div>
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{callCenterStats.pending}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending</div>
                    </div>
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{callCenterStats.inProgress}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Progress</div>
                    </div>
                    <div style={{
                        background: 'var(--glass-bg)',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{callCenterStats.resolved}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Resolved</div>
                    </div>
                </div>

                {/* Recent Call Center Complaints */}
                {callCenterComplaints.length > 0 && !showCallCenterOnly && (
                    <div>
                        <h4 style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Recent Call Center Complaints
                        </h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {callCenterComplaints.slice(0, 3).map(c => (
                                <div key={c._id} style={{
                                    background: 'var(--glass-bg)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>{c.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            👤 {c.callerName} • 📱 {c.callerPhone} • 📍 {c.location}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: c.status === 'Pending' ? 'rgba(245, 158, 11, 0.15)' : 
                                                   c.status === 'In Progress' ? 'rgba(59, 130, 246, 0.15)' : 
                                                   'rgba(16, 185, 129, 0.15)',
                                        color: c.status === 'Pending' ? '#f59e0b' : 
                                               c.status === 'In Progress' ? '#3b82f6' : '#10b981'
                                    }}>
                                        {c.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Loading secure channel...
                </div>
            ) : (
                <div style={{ marginTop: '2rem' }}>
                    {/* Escalated Section (Top Priority) */}
                    {!showCallCenterOnly && complaints.some(c => c.escalated && c.status !== 'Resolved') && (
                        <div className="escalated-section" style={{ marginBottom: '3rem', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.5rem', borderRadius: '15px', background: 'rgba(239, 68, 68, 0.05)' }}>
                            <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                ⚠️ Escalated Complaints (Pending Attention)
                            </h3>
                            <div className="complaints-list">
                                {complaints.filter(c => c.escalated && c.status !== 'Resolved').map(c => (
                                    <ComplaintCard 
                                        key={`esc-${c._id}`} 
                                        complaint={c} 
                                        onRefresh={() => {
                                            fetchComplaints();
                                            fetchCallCenterComplaints();
                                        }} 
                                        token={token} 
                                        user={user} 
                                        staffList={staffList}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>
                            {showZoneManagement ? '🗺️ Zone Management' : showCallCenterOnly ? '📞 Call Center Complaints' : 'Manage All Complaints'} 
                            {!showCallCenterOnly && !showZoneManagement && (
                                <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                    🔥 Most Reported Issues
                                </span>
                            )}
                        </h3>
                        <div className="toggle-group glass-panel" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => setShowZoneManagement(!showZoneManagement)}
                                className={showZoneManagement ? 'btn-primary' : 'btn-ghost'}
                                style={{ fontSize: '0.8rem', padding: '6px 12px', background: showZoneManagement ? 'rgba(99, 102, 241, 0.2)' : 'transparent', border: showZoneManagement ? '1px solid #6366f1' : '1px solid var(--glass-border)', color: showZoneManagement ? '#6366f1' : 'var(--text-primary)' }}
                            >
                                🗺️ Zones
                            </button>
                            {!showCallCenterOnly && (
                                <button 
                                    onClick={async () => {
                                        try {
                                            const res = await axios.post('/api/escalate/run');
                                            toast.success(res.data.message);
                                            fetchComplaints();
                                        } catch (err) {
                                            toast.error("Failed to run escalation engine");
                                        }
                                    }}
                                    className="btn-primary" 
                                    style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--danger)', border: 'none' }}
                                >
                                    🚀 Run Escalation Engine
                                </button>
                            )}
                            <button 
                                onClick={() => fetchComplaints('upvotes')} 
                                className="btn-ghost" 
                                style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid var(--primary-glow)' }}
                            >
                                🏆 Upvoted
                            </button>
                            <button 
                                onClick={() => fetchComplaints('latest')} 
                                className="btn-ghost" 
                                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                            >
                                ⏱️ Latest
                            </button>
                        </div>
                    </div>
                    {showZoneManagement ? (
                        <ZoneManagement token={token} onZoneChange={fetchZones} />
                    ) : (
                        <ComplaintList
                            complaints={displayedComplaints}
                            onRefresh={() => {
                                fetchComplaints();
                                fetchCallCenterComplaints();
                            }}
                            token={token}
                            user={user}
                            staffList={staffList}
                            zones={zones}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
