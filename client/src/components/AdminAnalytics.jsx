import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const AdminAnalytics = ({ complaints }) => {
    // Process Categories
    const categoryCounts = complaints.reduce((acc, current) => {
        const cat = current.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});
    
    const categoryData = Object.keys(categoryCounts).map(key => ({
        name: key,
        value: categoryCounts[key]
    }));

    // Process Status
    const statusCounts = complaints.reduce((acc, current) => {
        const status = current.status || 'Pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    
    const statusData = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#ff7300'];

    return (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
            <div className="glass-panel" style={{ flex: '1 1 400px', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-h)' }}>Complaints by Category</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie 
                                data={categoryData} 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={100} 
                                fill="#8884d8" 
                                dataKey="value" 
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-panel" style={{ flex: '1 1 400px', padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-h)' }}>Complaints by Status</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
