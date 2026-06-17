import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const HelpChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hello! I am your NexaCivic Help Assistant. How can I help you use the platform today? 🤖' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const { t, i18n } = useTranslation();
    const chatEndRef = useRef(null);

    const quickButtons = [
        { label: 'howToSubmit', text: 'How to submit complaint?' },
        { label: 'howToTrack', text: 'How to track complaint?' },
        { label: 'whatIsSLA', text: 'What is SLA?' },
        { label: 'howToRegister', text: 'How to register?' }
    ];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSend = async (msgText) => {
        const text = msgText || input;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await axios.post('/api/help-chatbot', { 
                message: text,
                language: i18n.language 
            });
            setMessages(prev => [...prev, { role: 'bot', content: res.data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Please try again later. (Network Error) ⚠️' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="help-chatbot-container" style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            fontFamily: 'var(--sans)'
        }}>
            {/* Chatbot Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'var(--gradient-neon)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.8rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                {isOpen ? '✕ Close Assistant' : 'Help Assistant 🤖'}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            position: 'absolute',
                            bottom: '4.5rem',
                            right: '0',
                            width: '380px',
                            height: '500px',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(24px)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '24px',
                            boxShadow: 'var(--shadow-glass)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.2rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem'
                        }}>
                            <div style={{ 
                                width: '10px', 
                                height: '10px', 
                                background: '#10b981', 
                                borderRadius: '50%',
                                boxShadow: '0 0 10px #10b981'
                            }}></div>
                            <span style={{ fontWeight: '700', color: '#fff' }}>NexaCivic Help Assistant</span>
                        </div>

                        {/* Messages Body */}
                        <div style={{
                            flex: 1,
                            padding: '1rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            scrollbarWidth: 'thin'
                        }}>
                            {messages.map((m, i) => (
                                <div key={i} style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    padding: '0.8rem 1rem',
                                    borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                    background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                                    color: '#fff',
                                    fontSize: '0.92rem',
                                    lineHeight: '1.5',
                                    boxShadow: m.role === 'user' ? '0 4px 12px rgba(139,92,246,0.3)' : 'none'
                                }}>
                                    {m.content}
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{
                                    alignSelf: 'flex-start',
                                    padding: '0.8rem 1rem',
                                    borderRadius: '18px 18px 18px 2px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                }}>
                                    Bot is typing... 💬
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Buttons Overlay */}
                        <div style={{
                            padding: '0.5rem 1rem',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            background: 'rgba(0,0,0,0.1)',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            {quickButtons.map(btn => (
                                <button 
                                    key={btn.label}
                                    onClick={() => handleSend(btn.text)}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '4px 10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '20px',
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    {btn.text}
                                </button>
                            ))}
                        </div>

                        {/* Input Footer */}
                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{
                            padding: '1rem',
                            display: 'flex',
                            gap: '0.5rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your help request..."
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '10px',
                                    padding: '0.6rem 1rem',
                                    color: '#fff',
                                    fontSize: '0.9rem'
                                }}
                            />
                            <button type="submit" style={{
                                background: 'var(--primary)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0.6rem 1rem',
                                color: '#fff',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}>
                                Send
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HelpChatbot;
