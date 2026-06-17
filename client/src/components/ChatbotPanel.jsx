import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, Bot, User, Sparkles, MessageSquare, AlertCircle, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ChatbotPanel = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: t('assistantWelcome', 'Hello! I am your NexaCivic Assistant 🤖. How can I help you today?') }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text = input) => {
        const messageToSend = text || input;
        if (!messageToSend.trim() || loading) return;

        const userMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post('/api/chatbot', {
                message: messageToSend,
                history: messages.slice(-5) // Send last 5 messages for context
            });

            setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: t('assistantError', "I'm sorry, I'm having trouble connecting right now. Please try again later.") 
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const quickActions = [
        { label: "Submit Complaint", icon: <AlertCircle size={14} />, intent: "How do I submit a complaint?" },
        { label: "Track Status", icon: <MessageSquare size={14} />, intent: "How can I track my complaint status?" },
        { label: "SLA / Priority", icon: <BarChart3 size={14} />, intent: "What are the SLA times and priority levels?" }
    ];

    return (
        <div className="chatbot-overlay animate-fade-in" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '380px',
            height: '600px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(30px)',
            webkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(139, 92, 246, 0.1)',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.25rem',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--gradient-neon)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 0 10px var(--primary-glow)'
                    }}>
                        <Bot size={18} color="#fff" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{t('assistant', 'NexaCivic Assistant')}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t('onlineReady', 'Online & Ready')}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                background: 'rgba(0,0,0,0.2)'
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '100%'
                    }}>
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                            background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.12)',
                            color: '#fff',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            maxWidth: '90%',
                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '18px', display: 'flex', gap: '5px' }}>
                        <span className="typing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'typing 1s infinite' }}></span>
                        <span className="typing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'typing 1s infinite 0.2s' }}></span>
                        <span className="typing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'typing 1s infinite 0.4s' }}></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div style={{
                padding: '0.75rem 1rem',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                borderTop: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                {quickActions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSend(action.intent)}
                        style={{
                            whiteSpace: 'nowrap',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'var(--primary)' }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'var(--glass-border)' }}
                    >
                        {action.icon}
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                style={{
                    padding: '1rem',
                    borderTop: '1px solid var(--glass-border)',
                    display: 'flex',
                    gap: '10px',
                    background: 'rgba(0,0,0,0.3)'
                }}
            >
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('askAnything', "Ask anything...")}
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none'
                    }}
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'var(--primary)',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        opacity: !input.trim() || loading ? 0.5 : 1
                    }}
                >
                    <Send size={18} />
                </button>
            </form>

            <style>{`
                @keyframes typing {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-3px); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ChatbotPanel;
