import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Sparkles, MessageSquare, AlertCircle, BarChart3, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const AssistantPage = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
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
                history: messages.slice(-10) // More context for full page
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

    const quickActions = [
        { label: t('submitComplaint', "Submit Complaint"), icon: <AlertCircle size={14} />, intent: "How do I submit a complaint?" },
        { label: t('trackStatus', "Track Status"), icon: <MessageSquare size={14} />, intent: "How can I track my complaint status?" },
        { label: t('slaPriority', "SLA / Priority"), icon: <BarChart3 size={14} />, intent: "What are the SLA times and priority levels?" }
    ];

    return (
        <div className="animate-fade-in" style={{ 
            maxWidth: '1000px', 
            margin: '0 auto', 
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
        }}>
            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                        onClick={() => navigate(-1)}
                        className="btn-ghost"
                        style={{ border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-h)' }}>{t('aiAssistant', 'AI Assistant')}</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('assistantDesc', 'Your smart companion for civic solutions')}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('onlineReady', 'Online & Ready')}</span>
                </div>
            </div>

            {/* Chat Container */}
            <div className="glass-panel" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '0', 
                overflow: 'hidden',
                borderRadius: '24px',
                background: 'rgba(15, 23, 42, 0.4)'
            }}>
                {/* Messages Hub */}
                <div style={{ 
                    flex: 1, 
                    padding: '2rem', 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.5rem',
                    background: 'rgba(0,0,0,0.1)'
                }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{ 
                            display: 'flex', 
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={{ 
                                    width: '35px', 
                                    height: '35px', 
                                    borderRadius: '50%', 
                                    background: 'var(--gradient-neon)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    marginTop: '5px'
                                }}>
                                    <Bot size={18} color="#fff" />
                                </div>
                            )}
                            
                            <div style={{ 
                                padding: '14px 20px', 
                                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                color: '#fff',
                                maxWidth: '70%',
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}>
                                {msg.content}
                            </div>

                            {msg.role === 'user' && (
                                <div style={{ 
                                    width: '35px', 
                                    height: '35px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(255,255,255,0.1)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1px solid var(--glass-border)',
                                    marginTop: '5px'
                                }}>
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--gradient-neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bot size={18} color="#fff" />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 18px', borderRadius: '20px', display: 'flex', gap: '5px' }}>
                                <span className="typing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'typing 1s infinite' }}></span>
                                <span className="typing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'typing 1s infinite 0.2s' }}></span>
                                <span className="typing-dot" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animation: 'typing 1s infinite 0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Section */}
                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--glass-border)' }}>
                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '1.5rem' }}>
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(action.intent)}
                                style={{
                                    whiteSpace: 'nowrap',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-h)',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        style={{ display: 'flex', gap: '12px' }}
                    >
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('askAnything', "Ask anything...")}
                            autoFocus
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                padding: '14px 20px',
                                color: '#fff',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || loading}
                            style={{
                                width: '54px',
                                height: '54px',
                                borderRadius: '16px',
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
                            <Send size={24} />
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes typing {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-3px); opacity: 1; }
                }
                .assistant-input:focus {
                    box-shadow: 0 0 15px var(--primary-glow);
                }
            `}</style>
        </div>
    );
};

export default AssistantPage;
