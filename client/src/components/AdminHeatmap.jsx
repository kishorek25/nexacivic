import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points }) => {
    const map = useMap();
    
    useEffect(() => {
        if (!points || points.length === 0) return;
        
        const heatLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [points, map]);

    return null;
};

const AdminHeatmap = ({ token }) => {
    const [points, setPoints] = useState([]);
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [days, setDays] = useState('');
    const [showHeatmap, setShowHeatmap] = useState(true);

    useEffect(() => {
        fetchHeatmapData();
        // eslint-disable-next-line
    }, [category, priority, days, token]);

    const fetchHeatmapData = async () => {
        try {
            const params = new URLSearchParams();
            if (category && category !== 'All') params.append('category', category);
            if (priority && priority !== 'All') params.append('priority', priority);
            if (days && days !== 'All') params.append('days', days);

            const res = await axios.get(`/api/complaints/heatmap?${params.toString()}`);

            // Convert [{lat, lng, intensity}] to [[lat, lng, intensity]]
            const formatted = res.data.map(d => [d.lat, d.lng, d.intensity]);
            setPoints(formatted);
        } catch (error) {
            console.error("Failed to fetch heatmap data", error);
        }
    };

    const { t } = useTranslation();

    return (
        <div className="stat-card animate-fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--glass-bg)', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t('complaintHotspots', '🔥 Complaint Hotspots')}
                </h3>
                <button 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                >
                    {showHeatmap ? t('hideHeatmap', "Hide Heatmap") : t('showHeatmap', "Show Heatmap")}
                </button>
            </div>

            {showHeatmap && (
                <>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        <select className="input-modern" style={{width: 'auto', flex: '1 1 150px'}} value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="">{t('allCategories', 'All Categories')}</option>
                            <option value="Road">{t('road', 'Road')}</option>
                            <option value="Garbage">{t('garbage', 'Garbage')}</option>
                            <option value="Water">{t('water', 'Water')}</option>
                            <option value="Streetlight">{t('streetlight', 'Streetlight')}</option>
                            <option value="Drainage">{t('drainage', 'Drainage')}</option>
                        </select>
                        <select className="input-modern" style={{width: 'auto', flex: '1 1 150px'}} value={priority} onChange={e => setPriority(e.target.value)}>
                            <option value="">{t('allPriorities', 'All Priorities')}</option>
                            <option value="High">{t('high', 'High')}</option>
                            <option value="Medium">{t('medium', 'Medium')}</option>
                            <option value="Low">{t('low', 'Low')}</option>
                        </select>
                        <select className="input-modern" style={{width: 'auto', flex: '1 1 150px'}} value={days} onChange={e => setDays(e.target.value)}>
                            <option value="">{t('allTime', 'All Time')}</option>
                            <option value="7">{t('last7Days', 'Last 7 Days')}</option>
                            <option value="30">{t('last30Days', 'Last 30 Days')}</option>
                        </select>
                    </div>

                    <div style={{ height: '450px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                        <MapContainer center={[20.5937, 78.9629]} zoom={5} minZoom={4} maxBounds={[[6.7, 68.1], [37.1, 97.4]]} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <HeatmapLayer points={points} />
                        </MapContainer>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '1rem', fontSize: '0.9rem' }}>
                        <span style={{color: 'var(--text-muted)', fontWeight: 'bold'}}>{t('legend', 'Legend')}:</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgb(0, 0, 255)' }}></span>
                            <span style={{ fontSize: '0.85rem' }}>{t('lowDensity', 'Low Density')}</span>
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>→</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgb(255, 0, 0)' }}></span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{t('highDensity', 'High Density 🔥')}</span>
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminHeatmap;
