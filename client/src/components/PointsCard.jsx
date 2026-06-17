import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Star, Trophy, Award, TrendingUp, Crown, Zap } from 'lucide-react';

const PointsCard = ({ token }) => {
    const { t } = useTranslation();
    const [pointsData, setPointsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPoints = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get('/api/points/me');
                console.log('Points data:', res.data);
                setPointsData(res.data);
            } catch (err) {
                console.error('Failed to fetch points:', err);
                console.error('Error response:', err.response?.data);
            } finally {
                setLoading(false);
            }
        };

        fetchPoints();
    }, [token]);

    if (loading) {
        return (
            <div className="points-card loading">
                <div className="points-loading">
                    <Zap className="animate-pulse" />
                </div>
            </div>
        );
    }

    const points = pointsData?.points || 0;
    const currentBadge = pointsData?.currentBadge || { name: 'Beginner', icon: '🌱', tier: 'starter' };
    const nextProgress = pointsData?.nextBadgeProgress;
    const stats = pointsData?.stats || { complaintsCreated: 0, complaintsResolved: 0 };

    const getTierColor = (tier) => {
        const colors = {
            gold: '#ffd700',
            silver: '#c0c0c0',
            bronze: '#cd7f32',
            starter: 'var(--primary)'
        };
        return colors[tier] || colors.starter;
    };

    const getBadgeGlow = (tier) => {
        const glows = {
            gold: '0 0 20px rgba(255, 215, 0, 0.5)',
            silver: '0 0 15px rgba(192, 192, 192, 0.4)',
            bronze: '0 0 15px rgba(205, 127, 50, 0.4)',
            starter: '0 0 10px rgba(59, 130, 246, 0.3)'
        };
        return glows[tier] || glows.starter;
    };

    return (
        <div className="points-card">
            <div className="points-card-header">
                <div className="header-left">
                    <div className="badge-display-large" style={{ boxShadow: getBadgeGlow(currentBadge.tier) }}>
                        <span className="badge-icon-large">{currentBadge.icon}</span>
                    </div>
                    <div className="user-rank-info">
                        <span className="current-badge-name">{currentBadge.name}</span>
                        <span className="member-since">{t('communityMember', 'Community Member')}</span>
                    </div>
                </div>
                <div className="header-right">
                    <Trophy className="trophy-mini" style={{ color: getTierColor(currentBadge.tier) }} />
                </div>
            </div>

            <div className="points-main">
                <div className="points-value-section">
                    <Star className="star-icon-large" />
                    <div className="points-text">
                        <span className="points-number">{points.toLocaleString()}</span>
                        <span className="points-label">{t('totalPoints', 'Total Points')}</span>
                    </div>
                </div>
            </div>

            {nextProgress && (
                <div className="progress-section">
                    <div className="progress-header">
                        <span className="progress-label">{t('nextBadge', 'Next Badge')}</span>
                        <span className="progress-target">
                            {nextProgress.nextBadge.icon} {nextProgress.nextBadge.name}
                        </span>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ 
                                    width: `${nextProgress.progress}%`,
                                    background: `linear-gradient(90deg, var(--primary), ${getTierColor(currentBadge.tier)})`
                                }}
                            />
                        </div>
                        <span className="progress-percent">{nextProgress.progress}%</span>
                    </div>
                    <span className="points-needed">
                        {nextProgress.pointsNeeded} {t('morePoints', 'more points needed')}
                    </span>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{stats.complaintsCreated}</span>
                    <span className="stat-label">{t('complaintsSubmitted', 'Submitted')}</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                    <span className="stat-value">{stats.complaintsResolved}</span>
                    <span className="stat-label">{t('resolved', 'Resolved')}</span>
                </div>
            </div>

            <div className="points-card-footer">
                <TrendingUp className="footer-icon" />
                <span>{t('earnMorePoints', 'Earn points by submitting & resolving complaints!')}</span>
            </div>

            <style>{`
                .points-card {
                    background: var(--bg-secondary);
                    border-radius: 1rem;
                    padding: 1.25rem;
                    border: 1px solid var(--border);
                }

                .points-card.loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                }

                .points-loading {
                    color: var(--primary);
                }

                .points-loading svg {
                    width: 2rem;
                    height: 2rem;
                }

                .points-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .badge-display-large {
                    width: 3.5rem;
                    height: 3.5rem;
                    border-radius: 50%;
                    background: var(--bg-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.75rem;
                }

                .user-rank-info {
                    display: flex;
                    flex-direction: column;
                }

                .current-badge-name {
                    font-weight: 600;
                    font-size: 1rem;
                    color: var(--text);
                }

                .member-since {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .trophy-mini {
                    width: 1.5rem;
                    height: 1.5rem;
                }

                .points-main {
                    margin: 1.25rem 0;
                }

                .points-value-section {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    justify-content: center;
                    padding: 1rem;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
                    border-radius: 0.75rem;
                }

                .star-icon-large {
                    width: 2.5rem;
                    height: 2.5rem;
                    color: #ffd700;
                    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
                }

                .points-text {
                    display: flex;
                    flex-direction: column;
                }

                .points-number {
                    font-size: 2.25rem;
                    font-weight: 700;
                    color: var(--text);
                    line-height: 1;
                }

                .points-label {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-top: 0.25rem;
                }

                .progress-section {
                    margin: 1.25rem 0;
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    border-radius: 0.75rem;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                }

                .progress-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .progress-target {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text);
                }

                .progress-bar-container {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: var(--bg);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease-out;
                }

                .progress-percent {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--primary);
                    min-width: 35px;
                }

                .points-needed {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    margin-top: 0.5rem;
                    text-align: right;
                }

                .stats-grid {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                    padding: 1rem 0;
                    border-top: 1px solid var(--border);
                    border-bottom: 1px solid var(--border);
                    margin: 1rem 0;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--primary);
                }

                .stat-label {
                    font-size: 0.7rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .stat-divider {
                    width: 1px;
                    height: 2rem;
                    background: var(--border);
                }

                .points-card-footer {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    justify-content: center;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .footer-icon {
                    width: 1rem;
                    height: 1rem;
                    color: var(--success);
                }

                @media (max-width: 640px) {
                    .points-card {
                        padding: 1rem;
                    }

                    .points-number {
                        font-size: 2rem;
                    }

                    .stats-grid {
                        gap: 1rem;
                    }

                    .stat-value {
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default PointsCard;
