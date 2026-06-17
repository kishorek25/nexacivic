import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ComplaintList from './ComplaintList';
import { useTranslation } from 'react-i18next';

const CommunityPage = ({ token, user }) => {
    const [publicComplaints, setPublicComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPublicComplaints = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await axios.get('/api/complaints/public');
            
            // We can pre-sort them by upvoted since this is a community page
            const sortedData = res.data.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || new Date(b.createdAt) - new Date(a.createdAt));
            setPublicComplaints(sortedData);
        } catch (error) {
            console.error("Failed to fetch community complaints:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchPublicComplaints();
        }
    // eslint-disable-next-line
    }, [token]);

    const { t } = useTranslation();

    return (
        <div className="animate-fade-in" style={{ padding: '0', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('communityHub', '🌍 Community Upvote Hub')}</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>{t('communityDesc', 'Explore civil complaints from your local area. Upvote the issues that matter to you to naturally boost their priority level and alert assigned staff immediately!')}</p>
            </div>
            
            {loading ? (
                <div style={{ textAlign: 'center', margin: '4rem 0', color: 'var(--text-muted)' }}>{t('loadingBoard', 'Loading Community Board...')}</div>
            ) : (
                <div style={{ marginTop: '1rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                     <ComplaintList 
                        complaints={publicComplaints} 
                        onRefresh={fetchPublicComplaints} 
                        token={token} 
                        user={user} 
                    />
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
