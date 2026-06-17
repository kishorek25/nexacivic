import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapPin, Users, Edit2, Trash2, Plus, X } from 'lucide-react';

const ZoneManagement = ({ token, onZoneChange }) => {
    const [zones, setZones] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingZone, setEditingZone] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        ward: '',
        description: '',
        centerLat: '',
        centerLng: '',
        radius: 5000,
        color: '#4f46e5',
        assignedStaff: []
    });

    useEffect(() => {
        fetchZones();
        fetchStaff();
    }, []);

    const fetchZones = async () => {
        try {
            const res = await axios.get('/api/zones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setZones(res.data);
        } catch (err) {
            console.error("Failed to fetch zones:", err);
            toast.error("Failed to fetch zones");
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await axios.get('/api/staff');
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to fetch staff:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            return toast.error("Zone name is required");
        }

        try {
            const payload = {
                ...formData,
                centerLat: formData.centerLat ? parseFloat(formData.centerLat) : null,
                centerLng: formData.centerLng ? parseFloat(formData.centerLng) : null,
                radius: parseInt(formData.radius) || 5000
            };

            if (editingZone) {
                await axios.put(`/api/zones/${editingZone._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Zone updated successfully");
            } else {
                await axios.post('/api/zones', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Zone created successfully");
            }

            setShowForm(false);
            setEditingZone(null);
            resetForm();
            fetchZones();
            if (onZoneChange) onZoneChange();
        } catch (err) {
            console.error("Failed to save zone:", err);
            toast.error(err.response?.data?.error || "Failed to save zone");
        }
    };

    const handleEdit = (zone) => {
        setEditingZone(zone);
        setFormData({
            name: zone.name || '',
            ward: zone.ward || '',
            description: zone.description || '',
            centerLat: zone.centerLat || '',
            centerLng: zone.centerLng || '',
            radius: zone.radius || 5000,
            color: zone.color || '#4f46e5',
            assignedStaff: zone.assignedStaff?.map(s => s._id || s) || []
        });
        setShowForm(true);
    };

    const handleDelete = async (zoneId) => {
        if (!window.confirm("Are you sure you want to delete this zone?")) return;

        try {
            await axios.delete(`/api/zones/${zoneId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Zone deleted/deactivated successfully");
            fetchZones();
        } catch (err) {
            console.error("Failed to delete zone:", err);
            toast.error(err.response?.data?.error || "Failed to delete zone");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            ward: '',
            description: '',
            centerLat: '',
            centerLng: '',
            radius: 5000,
            color: '#4f46e5',
            assignedStaff: []
        });
    };

    const handleStaffToggle = (staffId) => {
        setFormData(prev => ({
            ...prev,
            assignedStaff: prev.assignedStaff.includes(staffId)
                ? prev.assignedStaff.filter(id => id !== staffId)
                : [...prev.assignedStaff, staffId]
        }));
    };

    if (loading) {
        return <div className="loading-spinner">Loading zones...</div>;
    }

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-h)' }}>🗺️ Zone Management</h3>
                <button
                    onClick={() => { setShowForm(!showForm); setEditingZone(null); resetForm(); }}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : 'Add Zone'}
                </button>
            </div>

            {showForm && (
                <div style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>
                        {editingZone ? 'Edit Zone' : 'Create New Zone'}
                    </h4>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Zone Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-modern"
                                    placeholder="e.g., Zone A, North District"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Ward
                                </label>
                                <input
                                    type="text"
                                    value={formData.ward}
                                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                                    className="input-modern"
                                    placeholder="e.g., Ward 1, Ward 2"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-modern"
                                    placeholder="Brief description"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Center Latitude
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.centerLat}
                                    onChange={(e) => setFormData({ ...formData, centerLat: e.target.value })}
                                    className="input-modern"
                                    placeholder="e.g., 13.0827"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Center Longitude
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.centerLng}
                                    onChange={(e) => setFormData({ ...formData, centerLng: e.target.value })}
                                    className="input-modern"
                                    placeholder="e.g., 80.2707"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Radius (meters)
                                </label>
                                <input
                                    type="number"
                                    value={formData.radius}
                                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                                    className="input-modern"
                                    placeholder="5000"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    Color
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        style={{ width: '50px', height: '38px', border: 'none', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="input-modern"
                                        style={{ width: '100px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Assigned Staff ({formData.assignedStaff.length} selected)
                            </label>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                maxHeight: '150px',
                                overflowY: 'auto',
                                padding: '0.5rem',
                                background: 'var(--glass-bg)',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                {staffList.length === 0 ? (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No staff members available</span>
                                ) : (
                                    staffList.map(staff => (
                                        <button
                                            key={staff._id}
                                            type="button"
                                            onClick={() => handleStaffToggle(staff._id)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: formData.assignedStaff.includes(staff._id)
                                                    ? '2px solid var(--primary)'
                                                    : '1px solid var(--glass-border)',
                                                background: formData.assignedStaff.includes(staff._id)
                                                    ? 'rgba(79, 70, 229, 0.2)'
                                                    : 'transparent',
                                                color: formData.assignedStaff.includes(staff._id)
                                                    ? 'var(--primary)'
                                                    : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {staff.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ marginTop: '1.5rem', width: '100%' }}
                        >
                            {editingZone ? 'Update Zone' : 'Create Zone'}
                        </button>
                    </form>
                </div>
            )}

            {zones.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)'
                }}>
                    <MapPin size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No zones created yet</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create zones to organize complaints by geographic areas</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {zones.map(zone => (
                        <div
                            key={zone._id}
                            style={{
                                background: 'var(--glass-bg)',
                                border: `1px solid ${zone.color}40`,
                                borderLeft: `4px solid ${zone.color}`,
                                borderRadius: '12px',
                                padding: '1rem',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, color: zone.color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={16} />
                                        {zone.name}
                                    </h4>
                                    {zone.ward && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            🏛️ {zone.ward}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(zone)}
                                        className="btn-ghost"
                                        style={{ padding: '6px', borderRadius: '6px' }}
                                        title="Edit Zone"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(zone._id)}
                                        className="btn-ghost"
                                        style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                                        title="Delete Zone"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {zone.description && (
                                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {zone.description}
                                </p>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-h)' }}>
                                        {zone.stats?.total || 0}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#eab308' }}>
                                        {zone.stats?.pending || 0}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pending</div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22c55e' }}>
                                        {zone.stats?.resolved || 0}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resolved</div>
                                </div>
                            </div>

                            {zone.assignedStaff && zone.assignedStaff.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                                    <Users size={12} color="var(--text-muted)" />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                                        {zone.assignedStaff.length} staff:
                                    </span>
                                    {zone.assignedStaff.slice(0, 3).map(staff => (
                                        <span
                                            key={staff._id}
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                background: 'rgba(79, 70, 229, 0.1)',
                                                borderRadius: '10px',
                                                color: 'var(--primary)'
                                            }}
                                        >
                                            {staff.name}
                                        </span>
                                    ))}
                                    {zone.assignedStaff.length > 3 && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            +{zone.assignedStaff.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ZoneManagement;
