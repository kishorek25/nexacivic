import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DepartmentPerformance = ({ token }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('score'); // 'score' or 'name'

    useEffect(() => {
        fetchScores();
    }, []);

    const fetchScores = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/departments/scores', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Error fetching department scores:", err);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeClass = (score) => {
        if (score > 80) return "badge-resolved"; // Green
        if (score >= 50) return "badge-inprogress"; // Orange/Yellow
        return "badge-pending"; // Red
    };

    const getBadgeLabel = (score) => {
        if (score > 80) return "Excellent";
        if (score >= 50) return "Good";
        return "Needs Improvement";
    };

    const sortedData = [...data].sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        return a.department.localeCompare(b.department);
    });

    if (loading) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>Calculating performance scores...</p>
            </div>
        );
    }

    if (data.length === 0) return null;

    return (
        <div className="department-performance-section mb-4 animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    🏆 Department Performance
                </h3>
                <div className="toggle-group glass-panel" style={{ padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: 'none' }}>
                    <button 
                        onClick={() => setSortBy('score')} 
                        className={sortBy === 'score' ? 'btn-primary-mini' : 'btn-ghost'}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        🔢 Sort by Score
                    </button>
                    <button 
                        onClick={() => setSortBy('name')} 
                        className={sortBy === 'name' ? 'btn-primary-mini' : 'btn-ghost'}
                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                        🔤 Sort by Name
                    </button>
                </div>
            </div>

            <div className="analytics-grid" style={{ marginBottom: '2rem' }}>
                {/* Bar Chart Visualization */}
                <div className="glass-panel" style={{ padding: '1.5rem', height: '350px' }}>
                    <h4 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                        Performance Score Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis 
                                dataKey="department" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickSize={0}
                                tick={{ fill: '#94a3b8' }}
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickSize={0}
                                tick={{ fill: '#94a3b8' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.score > 80 ? 'var(--success)' : entry.score >= 50 ? 'var(--warning)' : 'var(--danger)'} 
                                        opacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score Summary Box */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
                    {data.slice(0, 1).map(top => (
                        <div key="leader" className="text-center">
                            <span style={{ fontSize: '2rem' }}>🥇</span>
                            <h4 style={{ color: 'var(--success)', margin: '0.5rem 0' }}>Top Performing Dept</h4>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'var(--gradient-neon)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {top.department}
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', margin: '0.5rem 0' }}>
                                {top.score}
                            </div>
                            <span className={`badge ${getBadgeClass(top.score)}`}>
                                {getBadgeLabel(top.score)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>RANK</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>DEPARTMENT</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>SCORE</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>STATUS</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>RESOLVED</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>ESCALATED</th>
                                <th style={{ padding: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>AVG TIME</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((dept, index) => (
                                <tr 
                                    key={dept.department} 
                                    style={{ 
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: dept.rank === 1 ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                                        transition: 'background 0.3s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = dept.rank === 1 ? 'rgba(16, 185, 129, 0.03)' : 'transparent'}
                                >
                                    <td style={{ padding: '1.2rem', fontWeight: '800', color: dept.rank === 1 ? 'var(--success)' : 'inherit' }}>
                                        #{dept.rank}
                                    </td>
                                    <td style={{ padding: '1.2rem', fontWeight: '600', color: 'var(--text-h)' }}>
                                        {dept.department}
                                        {dept.rank === 1 && <span style={{ marginLeft: '10px' }}>⭐</span>}
                                    </td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <span style={{ 
                                            fontSize: '1.1rem', 
                                            fontWeight: '700', 
                                            color: dept.score > 80 ? 'var(--success)' : dept.score >= 50 ? 'var(--warning)' : 'var(--danger)'
                                        }}>
                                            {dept.score}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem' }}>
                                        <span className={`badge ${getBadgeClass(dept.score)}`}>
                                            {getBadgeLabel(dept.score)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.2rem', color: 'var(--success)', fontWeight: '600' }}>
                                        {dept.resolved}
                                    </td>
                                    <td style={{ padding: '1.2rem', color: dept.escalated > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                        {dept.escalated}
                                    </td>
                                    <td style={{ padding: '1.2rem', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                        {dept.avgTime} days
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DepartmentPerformance;
