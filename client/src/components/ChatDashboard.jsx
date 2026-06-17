import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const ChatDashboard = ({ user, token, complaints }) => {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Filter valid complaints
    const validComplaints = complaints.filter(c => c && c._id);

    // Fetch messages for a specific complaint
    useEffect(() => {
        if (!selectedComplaint) return;
        
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/messages/${selectedComplaint._id}`);
                setMessages(res.data);
            } catch (error) {
                console.error("Error fetching messages", error);
                toast.error(t('errorChatHistory', "Could not fetch chat history."));
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        
        // Basic polling implementation for "real-time" feel (refreshes every 5 seconds)
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [selectedComplaint, token]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedComplaint) return;

        try {
            await axios.post(`/api/messages`, {
                complaintId: selectedComplaint._id,
                message: newMessage
            });
            
            // Optimistic UI update
            setMessages(prev => [...prev, {
                _id: Date.now(),
                senderId: user.id,
                senderRole: user.role,
                senderName: user.name,
                message: newMessage,
                createdAt: new Date().toISOString()
            }]);
            
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(t('errorSendMessage', "Failed to send message."));
        }
    };
    const handleReaction = async (messageId, emoji) => {
        if (!messageId) return;
        try {
            const res = await axios.put(`/api/messages/${messageId}/react`, { reaction: emoji });
            setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
        } catch (error) {
            console.error("Error reacting:", error);
            toast.error(t('errorReaction', "Failed to react to message"));
        }
    };


    const { t } = useTranslation();

    return (
        <div className="chat-dashboard" style={{ display: 'flex', height: '80vh', background: 'var(--glass-bg)', borderRadius: '15px', border: '1px solid var(--glass-border)', overflow: 'hidden', backdropFilter: 'blur(10px)', color: 'var(--text-h)' }}>
            
            {/* Sidebar: Threads / Complaints */}
            <div className="chat-sidebar" style={{ width: '30%', borderRight: '1px solid var(--glass-border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{t('activeChats', '💬 Active Chats')}</h3>
                </div>
                
                {validComplaints.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {t('noChats', 'No complaints available to chat.')}
                    </div>
                ) : (
                    validComplaints.map(c => (
                        <div 
                            key={c._id} 
                            onClick={() => setSelectedComplaint(c)}
                            style={{ 
                                padding: '1rem', 
                                borderBottom: '1px solid var(--glass-border)', 
                                cursor: 'pointer',
                                background: selectedComplaint?._id === c._id ? 'var(--primary-glow)' : 'transparent',
                                transition: 'all 0.2s ease',
                                borderLeft: selectedComplaint?._id === c._id ? '4px solid var(--primary)' : '4px solid transparent'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.title}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: selectedComplaint?._id === c._id ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{c.complaintId || 'Legacy Ticket'}</span>
                                <span className={c.status === 'Resolved' ? 'text-success' : 'text-warning'}>{c.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Main Chat Window */}
            <div className="chat-window" style={{ width: '70%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                {selectedComplaint ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-h)' }}>
                                {selectedComplaint.title} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '10px' }}>#{selectedComplaint.complaintId}</span>
                            </h3>
                            <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                                {selectedComplaint.status}
                            </span>
                        </div>

                        {/* Chat Messages */}
                        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {loading && messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>{t('loadingMessages', 'Loading messages...')}</div>
                            ) : messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontStyle: 'italic' }}>
                                    {t('noMessages', 'No messages yet. Start the conversation!')}
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMine = msg.senderId === user.id;
                                    
                                    // Generate different colors for Staff vs Admin vs User
                                    const getRoleColor = (r) => {
                                        if (r === 'admin') return '#ef4444'; // Red for admin
                                        if (r === 'staff') return '#f59e0b'; // Amber for staff
                                        return 'var(--primary)'; // Blue default for user
                                    };

                                    return (
                                        <div key={msg._id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '100%', animation: 'fadeIn 0.3s ease-in' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px', marginRight: '4px' }}>
                                                <span style={{ fontWeight: 'bold', color: getRoleColor(msg.senderRole) }}>
                                                    {msg.senderName} ({msg.senderRole.charAt(0).toUpperCase() + msg.senderRole.slice(1)})
                                                </span>
                                                <span style={{ marginLeft: '8px' }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'center', maxWidth: '100%', gap: '8px' }}>
                                                <div style={{ 
                                                    padding: '10px 15px', 
                                                    borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                                    background: isMine ? 'var(--primary)' : 'var(--glass-bg)',
                                                    border: isMine ? 'none' : '1px solid var(--glass-border)',
                                                    color: isMine ? '#fff' : 'var(--text-h)',
                                                    maxWidth: '75%',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                    wordWrap: 'break-word',
                                                    position: 'relative'
                                                }}>
                                                    {msg.message}
                                                    
                                                    {msg.reaction && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '-12px',
                                                            [isMine ? 'left' : 'right']: '10px',
                                                            background: 'var(--glass-bg)',
                                                            borderRadius: '12px',
                                                            padding: '2px 5px',
                                                            fontSize: '0.9rem',
                                                            border: '1px solid var(--glass-border)',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                            cursor: 'pointer',
                                                            zIndex: 2
                                                        }} onClick={() => handleReaction(msg._id, msg.reaction)}>
                                                            {msg.reaction}
                                                        </div>
                                                    )}
                                                </div>

                                                {!isMine && msg._id && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        {['👍', '❤️', '😂', '👎'].map(emoji => (
                                                            <span 
                                                                key={emoji} 
                                                                onClick={() => handleReaction(msg._id, emoji)}
                                                                style={{ cursor: 'pointer', opacity: 0.3, transition: 'all 0.2s ease', padding: '2px', display: 'inline-block' }}
                                                                onMouseEnter={(e) => { e.target.style.opacity = 1; e.target.style.transform = 'scale(1.2)' }}
                                                                onMouseLeave={(e) => { e.target.style.opacity = 0.3; e.target.style.transform = 'scale(1)' }}
                                                                title="React"
                                                            >
                                                                {emoji}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input Field */}
                        <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)' }}>
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={t('typeMessage', 'Type your message here...')}
                                style={{ flex: 1, padding: '10px 18px', borderRadius: '24px', color: '#fff', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.95rem', outline: 'none' }}
                                onFocus={(e) => e.target.style.background = 'rgba(255,255,255,0.18)'}
                                onBlur={(e) => e.target.style.background = 'rgba(255,255,255,0.12)'}
                            />
                            <button type="submit" disabled={!newMessage.trim()} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: !newMessage.trim() ? 'rgba(255,255,255,0.1)' : 'var(--primary)', color: '#fff', cursor: !newMessage.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', fontSize: '1.1rem', flexShrink: 0 }}>
                                ➤
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ fontSize: '4rem', opacity: 0.5 }}>💬</div>
                        <h2>{t('selectChat', 'Select a complaint to start chatting')}</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatDashboard;
