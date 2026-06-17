import React from 'react';
import Dashboard from './Dashboard';
import ComplaintList from './ComplaintList';

const StaffPage = ({ complaints, fetchComplaints, token, user, loading }) => {
    return (
        <div className="staff-page animate-fade-in">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center' }}>
                Staff Portal
            </h2>
            
            <Dashboard complaints={complaints} />
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Loading assignments...
                </div>
            ) : (
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0 }}>
                            Your Assigned Complaints
                            <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(251, 11, 36, 0.2)' }}>
                                🔥 Most Reported Issues
                            </span>
                        </h3>
                        <div className="toggle-group glass-panel" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px' }}>
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
                    <ComplaintList
                        complaints={complaints}
                        onRefresh={fetchComplaints}
                        token={token}
                        user={user}
                    />
                </div>
            )}
        </div>
    );
};

export default StaffPage;
