import React, { useState } from 'react';
import axios from 'axios';
import { Star, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { toast } from 'react-toastify';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTranslation } from 'react-i18next';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ComplaintCard = ({ complaint, onRefresh, token, user, staffList = [], zones = [] }) => {
    const { t } = useTranslation();
    const { _id, complaintId, title, description, location, status, createdAt, imageUrl, lat, lng, category, assignedTo, priority = 'Medium', aiPriority, prioritySource = 'AUTO', aiGenerated, slaDeadline, slaStatus, upvotes = [], upvotesCount = 0, rating, feedback, feedbackGiven, escalated, escalatedAt, escalationLevel = 1, escalationHistory = [], source = 'web', callerName, callerPhone, zone, zoneId, ward } = complaint;

    const zoneColor = zones.find(z => z.name === zone)?.color || '#4f46e5';

    // Feedback States
    const [ratingInput, setRatingInput] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackInput, setFeedbackInput] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

    // Escalation States
    const [showEscalationTimeline, setShowEscalationTimeline] = useState(false);
    const [escalating, setEscalating] = useState(false);
    const [escalationReason, setEscalationReason] = useState('');

    // Format the timestamp nicely
    const date = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    }) : 'No Date';

    // Figure out which CSS class to use for the colored badges
    const getBadgeClass = (status) => {
        if (status === 'Pending') return 'badge-pending';
        if (status === 'In Progress') return 'badge-inprogress';
        if (status === 'Resolved') return 'badge-resolved';
        return '';
    };

    const getPriorityBadgeClass = (p) => {
        if (p === 'High') return 'badge-high';
        if (p === 'Medium') return 'badge-medium';
        if (p === 'Low') return 'badge-low';
        return '';
    };

    const getPriorityIcon = (p) => {
        if (p === 'High') return '🔴';
        if (p === 'Medium') return '🟡';
        if (p === 'Low') return '🟢';
        return '⚡';
    };

    const getSlaDisplay = () => {
        if (status === 'Resolved') {
            return {
                text: slaStatus === 'Delayed' ? `🔴 ${t('resolvedLate', 'Resolved Late')}` : `🟢 ${t('resolvedOnTime', 'Resolved On Time')}`,
                className: slaStatus === 'Delayed' ? 'sla-delayed' : 'sla-ontime'
            };
        }
        if (!slaDeadline) return null;
        
        const now = new Date();
        const deadline = new Date(slaDeadline);
        const diffMs = deadline - now;
        
        if (diffMs < 0) {
            return { text: `🔴 ${t('overdue', 'Overdue')}`, className: 'sla-delayed' };
        }
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
             return { text: `⏳ ${diffDays} ${t('daysLeft', 'days left')}`, className: 'sla-ontime' };
        }
        return { text: `⏳ ${diffHours} ${t('hoursLeft', 'hours left')}`, className: 'sla-warning' };
    };
    const slaInfo = getSlaDisplay();

    const getEscalationBadge = (level) => {
        const badges = {
            1: { icon: '🟢', text: t('level1Normal', 'Normal'), class: 'escalation-level-1' },
            2: { icon: '🟡', text: t('level2Escalated', 'Escalated'), class: 'escalation-level-2' },
            3: { icon: '🔴', text: t('level3High', 'High Escalation'), class: 'escalation-level-3' },
            4: { icon: '🚨', text: t('level4Critical', 'Critical'), class: 'escalation-level-4' }
        };
        return badges[level] || badges[1];
    };

    const escalationBadge = getEscalationBadge(escalationLevel);

    const handleManualEscalate = async () => {
        if (escalationLevel >= 4) {
            toast.warn(t('maxEscalation', 'Maximum escalation level reached'));
            return;
        }
        setEscalating(true);
        try {
            await axios.post(`/api/escalate/${_id}`, {
                reason: escalationReason || t('manualEscalation', 'Manual escalation by admin')
            });
            toast.success(t('escalationSuccess', 'Complaint escalated successfully'));
            setEscalationReason('');
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Escalation failed:', error);
            toast.error(error.response?.data?.error || t('escalationFailed', 'Escalation failed'));
        } finally {
            setEscalating(false);
        }
    };

    const handleUpvote = async () => {
        try {
            await axios.post(`/api/complaints/${_id}/upvote`);
            onRefresh();
        } catch (error) {
            console.error("Failed to upvote", error);
            toast.error(t('errorUpvote', "Could not upvote."));
        }
    };
    const hasUpvoted = user && upvotes.includes(user.id);

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
            await axios.put(`/api/complaints/${_id}/status`, {
                status: newStatus
            });
            onRefresh(); // Refresh the list automatically to show new status!
            if (newStatus === 'Resolved') {
                toast.success(t('resolvedSuccess', "Complaint resolved"));
            } else {
                toast.success(t('statusUpdated', "Status updated"));
            }
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error(t('errorUpdateStatus', "Could not update status. Please try again."));
        }
    };

    const handleDelete = async () => {
        // Double check with user before deleting
        if (!window.confirm(t('confirmDelete', "Are you sure you want to delete this complaint?"))) return;

        try {
            await axios.delete(`/api/complaints/${_id}`);
            onRefresh(); // Refresh the list automatically to remove the card!
            toast.success(t('deletedSuccess', "Complaint deleted"));
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error(t('errorDelete', "Could not delete complaint"));
        }
    };

    const handleAssign = async (e) => {
        const selectedStaff = e.target.value;
        try {
            await axios.put(`/api/complaints/${_id}/assign`, {
                assignedTo: selectedStaff
            });
            onRefresh();
            toast.success(t('assignSuccess', "Staff assigned successfully!"));
        } catch (error) {
            console.error("Failed to assign staff", error);
            toast.error(t('errorAssign', "Could not assign complaint."));
        }
    };

    const handlePriorityChange = async (e) => {
        const newPriority = e.target.value;
        try {
            await axios.put(`/api/complaints/${_id}/priority`, {
                priority: newPriority
            });
            onRefresh();
            toast.success(t('priorityUpdated', "Priority updated"));
        } catch (error) {
            console.error("Failed to update priority", error);
            toast.error(t('errorPriority', "Could not update priority."));
        }
    };

    const [downloadingReceipt, setDownloadingReceipt] = useState(false);

    const handleDownloadReceipt = async () => {
        setDownloadingReceipt(true);
        try {
            const res = await axios.get(`/api/complaints/${_id}/receipt`, {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `complaint_receipt_${complaintId || _id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(link.href);
            toast.success(t('receiptDownloaded', 'Receipt downloaded successfully!'));
        } catch (error) {
            console.error('Failed to download receipt:', error);
            toast.error(t('receiptError', 'Failed to download receipt. Please try again.'));
        } finally {
            setDownloadingReceipt(false);
        }
    };

    const submitFeedback = async () => {
        if (ratingInput < 1) {
            return toast.error(t('selectStarRating', "Please select a star rating!"));
        }
        
        setFeedbackSubmitting(true);
        try {
            const res = await axios.post(`/api/complaints/${_id}/feedback`, {
                rating: ratingInput,
                feedback: feedbackInput
            });
            console.log('Feedback submitted successfully:', res.data);
            toast.success(t('feedbackThanks', "Thank you for your feedback!"));
            
            // Reset form
            setRatingInput(0);
            setFeedbackInput('');
            
            // Refresh to show updated data
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Feedback submission error:', error);
            const errorMessage = error.response?.data?.error || t('errorFeedback', "Failed to submit feedback.");
            toast.error(errorMessage);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    return (
        <div className={`complaint-card ${escalated ? 'escalated-card' : ''}`} style={escalated ? { border: '2px solid #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' } : {}}>
            <div className="card-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {complaintId && (
                             <span 
                                className="badge" 
                                style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', cursor: 'pointer', color: 'var(--text-h)' }}
                                onClick={() => { navigator.clipboard.writeText(complaintId); toast.success('Tracking ID Copied!'); }}
                                title="Click to copy Tracking ID"
                             >
                                 📋 {complaintId}
                             </span>
                        )}
                        <h3 className="card-title">{title}</h3>
                        {slaInfo && <span className={`badge ${slaInfo.className}`}>{slaInfo.text}</span>}
                    </div>
                    <div className="card-meta">
                        <span>📍 {location}</span>
                        <span>📅 {date}</span>
                        {category && <span className="meta-chip">📂 {category}</span>}
                        {assignedTo && <span className="meta-chip">👤 {assignedTo.name}</span>}
                        {aiGenerated && <span className="meta-chip" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>✨ {t('aiDetected', 'AI Detected')}</span>}
                        
                        {aiPriority && (
                            <span className={`meta-chip badge ${getPriorityBadgeClass(aiPriority)}`}>
                                🤖 {t('aiPriority', 'AI Priority:')} {t(aiPriority.toLowerCase(), aiPriority)}
                            </span>
                        )}
                        
                        <span className={`meta-chip badge ${getPriorityBadgeClass(priority)}`}>
                            {priority === 'High' ? `🔥 ${t('finalPriority', 'Final Priority:')} ${t('high', 'High')}` : `${getPriorityIcon(priority)} ${t('finalPriority', 'Final Priority:')} ${t(priority.toLowerCase(), priority)}`}
                        </span>

                        {aiPriority && priority !== aiPriority && prioritySource === 'AUTO' && (
                            <span className="meta-chip" style={{ background: 'var(--warning)', color: '#fff', border: '1px solid var(--warning)' }}>🔥 {t('boostedByCommunity', 'Boosted by Community')}</span>
                        )}
                        
                        {upvotesCount > 20 && (
                            <span className="meta-chip" style={{ background: 'var(--danger)', color: '#fff', border: '1px solid var(--danger)' }}>🔥 {t('trending', 'Trending')}</span>
                        )}

                        {source === 'call_center' && (
                            <span className="meta-chip" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid #06b6d4' }}>📞 Call Center</span>
                        )}

                        {(zone || ward) && (
                            <span className="meta-chip" style={{ background: `${zoneColor}15`, color: zoneColor, border: `1px solid ${zoneColor}` }}>
                                📍 {zone && `Zone: ${zone}`}{ward && ` | Ward: ${ward}`}
                            </span>
                        )}

                        <span className={`meta-chip ${escalationBadge.class}`} style={{
                            background: escalationLevel === 1 ? 'rgba(34, 197, 94, 0.15)' :
                                        escalationLevel === 2 ? 'rgba(234, 179, 8, 0.15)' :
                                        escalationLevel === 3 ? 'rgba(239, 68, 68, 0.15)' :
                                        'rgba(239, 68, 68, 0.25)',
                            color: escalationLevel === 1 ? '#22c55e' :
                                   escalationLevel === 2 ? '#eab308' :
                                   escalationLevel === 3 ? '#ef4444' :
                                   '#dc2626',
                            border: `1px solid ${escalationLevel === 1 ? '#22c55e' :
                                               escalationLevel === 2 ? '#eab308' :
                                               escalationLevel === 3 ? '#ef4444' :
                                               '#dc2626'}`,
                            fontWeight: 'bold'
                        }}>
                            {escalationBadge.icon} {t('level', 'Level')} {escalationLevel}: {escalationBadge.text}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span className={`badge ${getBadgeClass(status)}`}>
                        {t(status.toLowerCase().replace(' ', ''), status)}
                    </span>
                    <button
                        onClick={handleDownloadReceipt}
                        disabled={downloadingReceipt}
                        style={{
                            padding: '0.35rem 0.75rem',
                            background: downloadingReceipt ? 'rgba(79, 70, 229, 0.5)' : 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: downloadingReceipt ? 'not-allowed' : 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: downloadingReceipt ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                        }}
                        title="Download Receipt"
                    >
                        {downloadingReceipt ? (
                            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>
                        ) : (
                            '📄'
                        )}
                        {downloadingReceipt ? 'Generating...' : 'Receipt'}
                    </button>
                    {user && (user.role === 'admin' || user.role === 'staff') ? (
                        <div className="btn-upvote active" style={{ cursor: 'default', background: 'rgba(79, 70, 229, 0.15)', border: '1px solid var(--primary)' }}>
                            👍 {upvotesCount}
                        </div>
                    ) : (
                        <button 
                            onClick={handleUpvote} 
                            className={`btn-upvote ${hasUpvoted ? 'active' : ''}`}
                        >
                            👍 {upvotesCount}
                        </button>
                    )}
                </div>
            </div>

            {imageUrl && (
                <div style={{ margin: '15px 0' }}>
                    <img 
                        src={`${imageUrl}`} 
                        alt="Complaint Attachment" 
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                    />
                </div>
            )}

            {lat && lng && (
                <div style={{ height: '200px', width: '100%', margin: '15px 0', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                    <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} maxBounds={[[6.7, 68.1], [37.1, 97.4]]} maxBoundsViscosity={1.0}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[lat, lng]} />
                    </MapContainer>
                </div>
            )}

            <p className="card-desc">{description}</p>

            {/* Feedback Section */}
            {status === 'Resolved' && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    {feedbackGiven ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                                <strong style={{ color: 'var(--text-h)' }}>{t('ratingGiven', 'Rating Given:')} </strong>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={18} fill={star <= (rating || 0) ? 'var(--warning)' : 'none'} color={star <= (rating || 0) ? 'var(--warning)' : 'var(--text-muted)'} />
                                ))}
                            </div>
                            {feedback && <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', margin: 0 }}>"{feedback}"</p>}
                        </div>
                    ) : user && user.role === 'user' ? (
                        <div>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>{t('rateResolution', 'Rate your resolution experience')}</h4>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem', cursor: 'pointer' }} onMouseLeave={() => setHoverRating(0)}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                        key={star} 
                                        size={24} 
                                        onClick={() => !feedbackSubmitting && setRatingInput(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        fill={(hoverRating || ratingInput) >= star ? 'var(--warning)' : 'none'} 
                                        color={(hoverRating || ratingInput) >= star ? 'var(--warning)' : 'var(--text-muted)'} 
                                        style={{ transition: 'all 0.2s ease', opacity: feedbackSubmitting ? 0.5 : 1 }}
                                    />
                                ))}
                            </div>
                            <textarea 
                                value={feedbackInput} 
                                onChange={(e) => setFeedbackInput(e.target.value)} 
                                placeholder={t('leaveFeedback', 'Leave optional feedback...')} 
                                className="input-modern"
                                disabled={feedbackSubmitting}
                                style={{ width: '100%', minHeight: '60px', resize: 'vertical', marginBottom: '0.5rem' }}
                            />
                            <button 
                                onClick={submitFeedback} 
                                className="btn-primary" 
                                disabled={feedbackSubmitting}
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    width: '100%',
                                    opacity: feedbackSubmitting ? 0.7 : 1,
                                    cursor: feedbackSubmitting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {feedbackSubmitting ? '...' : t('submitFeedback', 'Submit Feedback')}
                            </button>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{t('noFeedbackYet', 'User has not provided feedback yet.')}</p>
                    )}
                </div>
            )}

            {/* Escalation Timeline Section */}
            {escalationHistory && escalationHistory.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setShowEscalationTimeline(!showEscalationTimeline)}
                    >
                        <h4 style={{ margin: 0, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} color="var(--warning)" />
                            {t('escalationTimeline', 'Escalation Timeline')} ({escalationHistory.length} {t('levels', 'levels')})
                        </h4>
                        {showEscalationTimeline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>

                    {showEscalationTimeline && (
                        <div style={{ marginTop: '1rem' }}>
                            {escalationHistory.slice().reverse().map((entry, index) => {
                                const levelColors = {
                                    2: { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', icon: '🟡' },
                                    3: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '🔴' },
                                    4: { bg: 'rgba(239, 68, 68, 0.15)', border: '#dc2626', icon: '🚨' }
                                };
                                const colors = levelColors[entry.level] || { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', icon: '🟢' };

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '0.75rem',
                                            marginBottom: '0.5rem',
                                            background: colors.bg,
                                            borderLeft: `3px solid ${colors.border}`,
                                            borderRadius: '6px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: 'var(--text-h)' }}>
                                                {colors.icon} {t('level', 'Level')} {entry.level}: {entry.escalatedTo}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(entry.date).toLocaleString()}
                                            </span>
                                        </div>
                                        {entry.reason && (
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {entry.reason}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            {user && (user.role === 'admin' || user.role === 'staff') && (
                <div className="card-actions">
                    {user.role === 'staff' && (
                        <>
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className="status-select input-modern"
                            >
                                <option value="Pending">{t('pending', 'Pending')}</option>
                                <option value="In Progress">{t('inProgress', 'In Progress')}</option>
                                <option value="Resolved">{t('resolved', 'Resolved')}</option>
                            </select>

                            <select
                                value={priority}
                                onChange={handlePriorityChange}
                                className="status-select input-modern"
                            >
                                <option value="Low">{t('lowPriority', 'Low Priority')}</option>
                                <option value="Medium">{t('mediumPriority', 'Medium Priority')}</option>
                                <option value="High">{t('highPriority', 'High Priority')}</option>
                            </select>
                        </>
                    )}

                    {user.role === 'admin' && (
                        <select
                            value={(assignedTo && assignedTo._id) || ''}
                            onChange={handleAssign}
                            className="status-select input-modern"
                        >
                            <option value="">{t('assignStaff', 'Assign Staff ▼')}</option>
                            {staffList.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    )}

                    {user.role === 'admin' && status !== 'Resolved' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                value={escalationReason}
                                onChange={(e) => setEscalationReason(e.target.value)}
                                placeholder={t('escalationReason', 'Reason (optional)')}
                                className="input-modern"
                                style={{ flex: 1, minWidth: '150px' }}
                            />
                            <button
                                onClick={handleManualEscalate}
                                disabled={escalating || escalationLevel >= 4}
                                className="btn-primary"
                                style={{
                                    background: escalationLevel >= 4 ? 'var(--text-muted)' : 'var(--warning)',
                                    minWidth: '120px'
                                }}
                                title={escalationLevel >= 4 ? t('maxEscalationReached', 'Maximum escalation reached') : t('escalateNow', 'Escalate Now')}
                            >
                                {escalating ? '...' : '⚠️'} {escalationLevel >= 4 ? t('maxLevel', 'Max Level') : t('escalate', 'Escalate')}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleDelete}
                        className="btn-danger"
                    >
                        {t('delete', 'Delete')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ComplaintCard;
