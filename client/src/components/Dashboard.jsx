import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import PointsCard from './PointsCard';

const Dashboard = ({ complaints, token }) => {
    const { t } = useTranslation();
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    const delayed = complaints.filter(c => c.slaStatus === 'Delayed' || (c.status !== 'Resolved' && c.slaDeadline && new Date(c.slaDeadline) < new Date())).length;
    const topComplaint = complaints.length > 0 ? [...complaints].sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0))[0] : null;

    const categoryData = [
        { name: t('pending', 'Pending'), value: pending },
        { name: t('inProgress', 'In Progress'), value: inProgress },
        { name: t('resolved', 'Resolved'), value: resolved },
    ];

    const trendData = complaints.slice(0, 20).reverse().map((c, i) => ({
        name: c.title?.substring(0, 16) || `Issue ${i + 1}`,
        statusValue: c.status === 'Resolved' ? 3 : c.status === 'In Progress' ? 2 : 1,
    }));

    const COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

    return (
        <section className="dashboard-section">
            <div className="gamification-row animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                <PointsCard token={token} />
            </div>

            <div className="dashboard animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <h3>{t('totalIssues', 'Total Issues')}</h3>
                    <div className="value">{total}</div>
                </div>
                <div className="stat-card">
                    <h3>{t('pending', 'Pending')}</h3>
                    <div className="value" style={{ color: 'var(--danger)' }}>{pending}</div>
                </div>
                <div className="stat-card">
                    <h3>{t('inProgress', 'In Progress')}</h3>
                    <div className="value" style={{ color: 'var(--warning)' }}>{inProgress}</div>
                </div>
                <div className="stat-card">
                    <h3>{t('resolved', 'Resolved')}</h3>
                    <div className="value" style={{ color: 'var(--success)' }}>{resolved}</div>
                </div>
            </div>

            <div className="dashboard animate-fade-in" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <h3>{t('slaViolations', 'SLA Violations')}</h3>
                    <div className="value" style={{ color: delayed > 0 ? 'var(--danger)' : 'var(--success)' }}>{delayed}</div>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('overdueTickets', 'overdue tickets')}</div>
                </div>

                {topComplaint && (
                    <div className="stat-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3>{t('topTrendingComplaint', '🔥 Top Trending Complaint')}</h3>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-h)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                            {topComplaint.title}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="badge badge-high" style={{ display: 'inline-block' }}>👍 {topComplaint.upvotesCount || 0} {t('appreciations', 'Appreciations')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="analytics-grid">
                <div className="chart-card">
                    <h3>{t('issueStatusBreakdown', 'Issue Status Breakdown')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Tooltip />
                            <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={2}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>{t('recentIssueStatusTrend', 'Recent Issue Status Trend')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="statusValue" stroke="#38bdf8" fill="#38bdf878" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
