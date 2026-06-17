import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
    const { t } = useTranslation();

    const steps = [
        { 
            step: '01', 
            icon: '🔐', 
            title: t('step1', 'Register / Login'), 
            detail: t('step1Desc', 'Create your account or sign in to start reporting issues.') 
        },
        { 
            step: '02', 
            icon: '📝', 
            title: t('step2', 'Submit Complaint'), 
            detail: t('step2Desc', 'Fill out a quick form with image and location details.') 
        },
        { 
            step: '03', 
            icon: '🤖', 
            title: t('step3', 'AI Verification'), 
            detail: t('step3Desc', 'System checks for spam, categorizes, and sets priority automatically.') 
        },
        { 
            step: '04', 
            icon: '👮', 
            title: t('step4', 'Admin Assigns Staff'), 
            detail: t('step4Desc', 'Local authorities review and assign specialized staff to fix the issue.') 
        },
        { 
            step: '05', 
            icon: '✅', 
            title: t('step5', 'Resolved + Feedback'), 
            detail: t('step5Desc', 'Track until completion and rate the service after it\'s fixed.') 
        },
    ];

    return (
        <section className="section" id="how-it-works" style={{ padding: '5rem 1rem', overflow: 'hidden' }}>
            <div className="section-header" style={{ marginBottom: '4rem' }}>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ fontSize: '2.8rem', marginBottom: '1rem' }}
                >
                    {t('workflowTitle', 'How NexaCivic Works')}
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}
                >
                    {t('workflowDesc', 'A smart, streamlined process to improve our city together.')}
                </motion.p>
            </div>

            <div className="workflow-grid" style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: '2.5rem',
                position: 'relative'
            }}>
                {steps.map((item, idx) => (
                    <React.Fragment key={item.step}>
                        <motion.div
                            className="step-card-modern"
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            whileHover={{ y: -10, transition: { duration: 0.2 } }}
                            style={{
                                flex: '1 1 240px',
                                maxWidth: '280px',
                                background: 'var(--glass-bg)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '24px',
                                padding: '2.5rem 1.5rem',
                                textAlign: 'center',
                                position: 'relative',
                                boxShadow: 'var(--shadow-glass)',
                                zIndex: 2
                            }}
                        >
                            <div className="step-badge" style={{
                                position: 'absolute',
                                top: '-15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'var(--gradient-neon)',
                                color: '#fff',
                                padding: '4px 16px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                            }}>
                                STEP {item.step}
                            </div>
                            
                            <div className="step-icon-wrapper" style={{
                                fontSize: '3.5rem',
                                marginBottom: '1.5rem',
                                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
                            }}>
                                {item.icon}
                            </div>
                            
                            <h3 style={{ 
                                fontSize: '1.3rem', 
                                marginBottom: '1rem', 
                                color: '#fff',
                                fontWeight: '700'
                            }}>
                                {item.title}
                            </h3>
                            
                            <p style={{ 
                                fontSize: '0.95rem', 
                                color: 'var(--text-muted)', 
                                lineHeight: '1.6' 
                            }}>
                                {item.detail}
                            </p>
                        </motion.div>
                        
                        {idx < steps.length - 1 && (
                            <div className="step-connector" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                color: 'rgba(255,255,255,0.1)',
                                userSelect: 'none'
                            }}>
                                ➜
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                style={{ marginTop: '5rem', textAlign: 'center' }}
            >
                <Link to="/register" className="btn-primary" style={{ 
                    padding: '1.2rem 3.5rem', 
                    fontSize: '1.1rem',
                    textDecoration: 'none',
                    display: 'inline-block',
                    width: 'auto'
                }}>
                    {t('getStarted', 'Get Started Now')} &rarr;
                </Link>
            </motion.div>

            <style>{`
                @media (max-width: 1100px) {
                    .step-connector { display: none !important; }
                    .workflow-grid { gap: 3rem !important; }
                }
                .step-card-modern:hover {
                    border-color: var(--primary) !important;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px var(--primary-glow) !important;
                }
            `}</style>
        </section>
    );
};

export default HowItWorks;
