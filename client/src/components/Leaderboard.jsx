import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Star, TrendingUp, Crown, Sparkles } from 'lucide-react';

const Leaderboard = ({ token }) => {
    const { t } = useTranslation();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await axios.get('/api/leaderboard?limit=20');
            console.log('Leaderboard response:', res.data);
            setLeaderboard(res.data);
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.error || 'Failed to load leaderboard. Please restart the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="rank-icon gold" />;
        if (rank === 2) return <Medal className="rank-icon silver" />;
        if (rank === 3) return <Medal className="rank-icon bronze" />;
        return <span className="rank-number">{rank}</span>;
    };

    if (loading) {
        return (
            <div className="leaderboard-container">
                <div className="loading-spinner">
                    <Sparkles className="animate-pulse" />
                    <span>Loading leaderboard...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="leaderboard-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <div className="header-title">
                    <Trophy className="trophy-icon" />
                    <h2>{t('leaderboard', 'Leaderboard')}</h2>
                </div>
                <p className="header-subtitle">{t('topContributors', 'Top Community Contributors')}</p>
            </div>

            {leaderboard.length === 0 ? (
                <div className="empty-state">
                    <TrendingUp className="empty-icon" />
                    <p>{t('noParticipants', 'No participants yet. Be the first!')}</p>
                </div>
            ) : (
                <>
                    <div className="top-three-container">
                        {leaderboard.slice(0, 3).map((user, index) => (
                            <div key={user.userId} className={`top-user-card rank-${index + 1}`}>
                                <div className="top-rank-badge">
                                    {getRankIcon(index + 1)}
                                </div>
                                <div className="top-user-avatar">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="top-user-info">
                                    <h4>{user.name}</h4>
                                    <div className="badge-display">
                                        <span className={`badge-icon ${user.badge.tier}`}>
                                            {user.badge.icon}
                                        </span>
                                        <span className="badge-name">{user.badge.name}</span>
                                    </div>
                                </div>
                                <div className="top-user-points">
                                    <span className="points-value">{user.points}</span>
                                    <span className="points-label">{t('points', 'pts')}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="leaderboard-table">
                        <div className="table-header">
                            <span className="col-rank">{t('rank', 'Rank')}</span>
                            <span className="col-user">{t('user', 'User')}</span>
                            <span className="col-badge">{t('badge', 'Badge')}</span>
                            <span className="col-points">{t('points', 'Points')}</span>
                        </div>
                        <div className="table-body">
                            {leaderboard.map((user) => (
                                <div key={user.userId} className={`table-row ${user.isTopThree ? 'top-three-row' : ''}`}>
                                    <span className="col-rank">
                                        {getRankIcon(user.rank)}
                                    </span>
                                    <span className="col-user">
                                        <div className="user-cell">
                                            <div className="user-avatar-small">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="user-name">{user.name}</span>
                                            {user.isTopThree && (
                                                <span className="top-badge">
                                                    {user.rank === 1 && '👑'}
                                                    {user.rank === 2 && '🥈'}
                                                    {user.rank === 3 && '🥉'}
                                                </span>
                                            )}
                                        </div>
                                    </span>
                                    <span className="col-badge">
                                        <span className={`badge-pill ${user.badge.tier}`}>
                                            {user.badge.icon} {user.badge.name}
                                        </span>
                                    </span>
                                    <span className="col-points">
                                        <div className="points-cell">
                                            <Star className="star-icon" />
                                            <span className="points-number">{user.points}</span>
                                        </div>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .leaderboard-container {
                    padding: 1.5rem;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .leaderboard-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                }

                .header-title h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text);
                    margin: 0;
                }

                .trophy-icon {
                    width: 2rem;
                    height: 2rem;
                    color: #ffd700;
                    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
                }

                .header-subtitle {
                    color: var(--text-muted);
                    margin-top: 0.5rem;
                    font-size: 0.95rem;
                }

                .top-three-container {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .top-user-card {
                    background: var(--bg-secondary);
                    border-radius: 1rem;
                    padding: 1.25rem;
                    text-align: center;
                    position: relative;
                    border: 2px solid transparent;
                    transition: transform 0.3s, box-shadow 0.3s;
                }

                .top-user-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .top-user-card.rank-1 {
                    border-color: #ffd700;
                    background: linear-gradient(180deg, rgba(255, 215, 0, 0.1) 0%, var(--bg-secondary) 100%);
                    order: 2;
                }

                .top-user-card.rank-2 {
                    border-color: #c0c0c0;
                    background: linear-gradient(180deg, rgba(192, 192, 192, 0.1) 0%, var(--bg-secondary) 100%);
                    order: 1;
                }

                .top-user-card.rank-3 {
                    border-color: #cd7f32;
                    background: linear-gradient(180deg, rgba(205, 127, 50, 0.1) 0%, var(--bg-secondary) 100%);
                    order: 3;
                }

                .top-rank-badge {
                    position: absolute;
                    top: -1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2rem;
                    height: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rank-icon {
                    width: 1.75rem;
                    height: 1.75rem;
                }

                .rank-icon.gold {
                    color: #ffd700;
                    filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5));
                }

                .rank-icon.silver {
                    color: #c0c0c0;
                    filter: drop-shadow(0 2px 4px rgba(192, 192, 192, 0.5));
                }

                .rank-icon.bronze {
                    color: #cd7f32;
                    filter: drop-shadow(0 2px 4px rgba(205, 127, 50, 0.5));
                }

                .rank-number {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-muted);
                }

                .top-user-avatar {
                    width: 3.5rem;
                    height: 3.5rem;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    margin: 0.75rem auto 0.5rem;
                }

                .top-user-info h4 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text);
                    margin: 0 0 0.5rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .badge-display {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.25rem;
                    font-size: 0.8rem;
                }

                .badge-icon {
                    font-size: 1rem;
                }

                .badge-name {
                    color: var(--text-muted);
                }

                .top-user-points {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border);
                }

                .points-value {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--primary);
                }

                .points-label {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .leaderboard-table {
                    background: var(--bg-secondary);
                    border-radius: 1rem;
                    overflow: hidden;
                }

                .table-header {
                    display: grid;
                    grid-template-columns: 60px 1fr 140px 80px;
                    padding: 1rem 1.25rem;
                    background: var(--bg-tertiary);
                    font-weight: 600;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-muted);
                }

                .table-body {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .table-row {
                    display: grid;
                    grid-template-columns: 60px 1fr 140px 80px;
                    padding: 0.875rem 1.25rem;
                    border-bottom: 1px solid var(--border);
                    transition: background 0.2s;
                    align-items: center;
                }

                .table-row:last-child {
                    border-bottom: none;
                }

                .table-row:hover {
                    background: var(--bg-tertiary);
                }

                .table-row.top-three-row {
                    background: rgba(59, 130, 246, 0.05);
                }

                .user-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .user-avatar-small {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: white;
                    flex-shrink: 0;
                }

                .user-name {
                    font-weight: 500;
                    color: var(--text);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .top-badge {
                    font-size: 0.9rem;
                }

                .badge-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.6rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .badge-pill.gold {
                    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 183, 0, 0.2));
                    color: #ffd700;
                }

                .badge-pill.silver {
                    background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(168, 168, 168, 0.2));
                    color: #c0c0c0;
                }

                .badge-pill.bronze {
                    background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(181, 101, 29, 0.2));
                    color: #cd7f32;
                }

                .badge-pill.starter {
                    background: var(--bg-tertiary);
                    color: var(--text-muted);
                }

                .points-cell {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .star-icon {
                    width: 1rem;
                    height: 1rem;
                    color: #ffd700;
                }

                .points-number {
                    font-weight: 600;
                    color: var(--primary);
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-muted);
                }

                .empty-icon {
                    width: 3rem;
                    height: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .loading-spinner {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    color: var(--text-muted);
                    gap: 1rem;
                }

                .loading-spinner svg {
                    width: 2rem;
                    height: 2rem;
                    color: var(--primary);
                }

                @media (max-width: 640px) {
                    .top-three-container {
                        grid-template-columns: 1fr;
                    }

                    .top-user-card.rank-1 { order: 1; }
                    .top-user-card.rank-2 { order: 2; }
                    .top-user-card.rank-3 { order: 3; }

                    .table-header,
                    .table-row {
                        grid-template-columns: 50px 1fr 100px 60px;
                        padding: 0.75rem 1rem;
                        font-size: 0.8rem;
                    }

                    .col-badge {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Leaderboard;
