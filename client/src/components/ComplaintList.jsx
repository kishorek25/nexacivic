import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ComplaintCard from './ComplaintCard';
import { useTranslation } from 'react-i18next';

const ComplaintList = ({ complaints, onRefresh, token, user, staffList = [], zones = [] }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [escalatedFilter, setEscalatedFilter] = useState('All');
    const [escalationLevelFilter, setEscalationLevelFilter] = useState('All');
    const [zoneFilter, setZoneFilter] = useState('All');
    const [wardFilter, setWardFilter] = useState('All');

    const [priorityFilter, setPriorityFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('Recent');

    const uniqueWards = [...new Set(zones.map(z => z.ward).filter(Boolean))];

    // Filter and search logic
    let filteredComplaints = complaints.filter((c) => {
        // Search by title or location (case insensitive)
        const matchesSearch =
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.location.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter by status 
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

        // Filter by category
        const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;

        // Filter by priority
        const complaintPriority = c.priority || 'Medium';
        const matchesPriority = priorityFilter === 'All' || complaintPriority === priorityFilter;

        // Filter by escalation
        const matchesEscalated = escalatedFilter === 'All' || (escalatedFilter === 'Escalated' && c.escalated);

        // Filter by escalation level
        const complaintLevel = c.escalationLevel || 1;
        const matchesEscalationLevel = escalationLevelFilter === 'All' || complaintLevel === parseInt(escalationLevelFilter);

        // Filter by zone
        const matchesZone = zoneFilter === 'All' || c.zone === zoneFilter;

        // Filter by ward
        const matchesWard = wardFilter === 'All' || c.ward === wardFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesEscalated && matchesEscalationLevel && matchesZone && matchesWard;
    });

    if (sortOrder === 'Upvoted') {
        filteredComplaints.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0) || new Date(b.createdAt) - new Date(a.createdAt));
    } else {
        filteredComplaints.sort((a, b) => {
            const pWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
            const wpA = pWeight[a.priority || 'Medium'] || 0;
            const wpB = pWeight[b.priority || 'Medium'] || 0;
            if (wpA !== wpB) return wpB - wpA;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    return (
        <div>
            <div className="controls-bar">
                <input
                    type="text"
                    placeholder={t('searchPlaceholder', 'Search by title or location...')}
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="All">{t('allStatuses', 'All Statuses')}</option>
                    <option value="Pending">{t('pending', 'Pending')}</option>
                    <option value="In Progress">{t('inProgress', 'In Progress')}</option>
                    <option value="Resolved">{t('resolved', 'Resolved')}</option>
                </select>

                <select
                    className="filter-select"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="All">{t('allCategories', 'All Categories')}</option>
                    <option value="Road">{t('road', 'Road')}</option>
                    <option value="Garbage">{t('garbage', 'Garbage')}</option>
                    <option value="Water">{t('water', 'Water')}</option>
                    <option value="Streetlight">{t('streetlight', 'Streetlight')}</option>
                    <option value="Drainage">{t('drainage', 'Drainage')}</option>
                    <option value="Other">{t('other', 'Other')}</option>
                </select>

                <select
                    className="filter-select"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                >
                    <option value="All">{t('allPriorities', 'All Priorities')}</option>
                    <option value="Low">{t('low', 'Low')}</option>
                    <option value="Medium">{t('medium', 'Medium')}</option>
                    <option value="High">{t('high', 'High')}</option>
                </select>

                <select
                    className="filter-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                >
                    <option value="Recent">{t('recentFirst', 'Recent First')}</option>
                    <option value="Upvoted">{t('mostUpvoted', 'Most Upvoted')}</option>
                </select>

                <select
                    className="filter-select"
                    value={escalatedFilter}
                    onChange={(e) => setEscalatedFilter(e.target.value)}
                    style={escalatedFilter === 'Escalated' ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
                >
                    <option value="All">{t('allComplaints', 'All Regular')}</option>
                    <option value="Escalated">⚠️ {t('escalatedOnly', 'Escalated')}</option>
                </select>

                <select
                    className="filter-select"
                    value={escalationLevelFilter}
                    onChange={(e) => setEscalationLevelFilter(e.target.value)}
                    style={escalationLevelFilter !== 'All' ? {
                        borderColor: escalationLevelFilter === '4' ? '#dc2626' :
                                    escalationLevelFilter === '3' ? '#ef4444' :
                                    escalationLevelFilter === '2' ? '#eab308' : '#22c55e',
                        color: escalationLevelFilter === '4' ? '#dc2626' :
                               escalationLevelFilter === '3' ? '#ef4444' :
                               escalationLevelFilter === '2' ? '#eab308' : '#22c55e'
                    } : {}}
                >
                    <option value="All">{t('allLevels', 'All Levels')}</option>
                    <option value="1">🟢 {t('level1Normal', 'Level 1 - Normal')}</option>
                    <option value="2">🟡 {t('level2Escalated', 'Level 2 - Escalated')}</option>
                    <option value="3">🔴 {t('level3High', 'Level 3 - High')}</option>
                    <option value="4">🚨 {t('level4Critical', 'Level 4 - Critical')}</option>
                </select>

                {zones.length > 0 && (
                    <>
                        <select
                            className="filter-select"
                            value={zoneFilter}
                            onChange={(e) => setZoneFilter(e.target.value)}
                            style={zoneFilter !== 'All' ? { borderColor: '#4f46e5', color: '#4f46e5' } : {}}
                        >
                            <option value="All">{t('allZones', 'All Zones')}</option>
                            {zones.map((z) => (
                                <option key={z._id} value={z.name}>📍 {z.name}</option>
                            ))}
                        </select>

                        {uniqueWards.length > 0 && (
                            <select
                                className="filter-select"
                                value={wardFilter}
                                onChange={(e) => setWardFilter(e.target.value)}
                                style={wardFilter !== 'All' ? { borderColor: '#2563eb', color: '#2563eb' } : {}}
                            >
                                <option value="All">{t('allWards', 'All Wards')}</option>
                                {uniqueWards.map((w) => (
                                    <option key={w} value={w}>🏛️ {w}</option>
                                ))}
                            </select>
                        )}
                    </>
                )}
            </div>

            <div className="complaints-list">
                {filteredComplaints.length > 0 ? (
                    filteredComplaints.map(complaint => (
                        <ComplaintCard
                            key={complaint._id}
                            complaint={complaint}
                            onRefresh={onRefresh}
                            token={token}
                            user={user}
                            staffList={staffList}
                            zones={zones}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <p>{t('noComplaintsFound', 'No complaints found matching your filters.')}</p>
                        {complaints.length === 0 && <p className="mt-2 text-muted">{t('addComplaintStart', 'Add a complaint above to get started!')}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComplaintList;
