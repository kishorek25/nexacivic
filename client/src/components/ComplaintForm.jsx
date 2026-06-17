import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const LocationIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
    </svg>
);

function LocationMarker({ position, setPosition, updateAddress }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            if (updateAddress) {
                updateAddress(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom() > 10 ? map.getZoom() : 15, { animate: true });
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

const ComplaintForm = ({ onComplaintAdded, token }) => {
    const { t, i18n } = useTranslation();
    const [form, setForm] = useState({
        title: "",
        category: "",
        description: "",
        location: "",
    });
    const [image, setImage] = useState(null);
    const [position, setPosition] = useState(null); // Maps LatLng
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Duplicate detection states
    const [duplicateInfo, setDuplicateInfo] = useState(null); // { existingComplaintId, existingComplaintRef, existingTitle }
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const [upvoting, setUpvoting] = useState(false);
    const [upvoteDone, setUpvoteDone] = useState(false);
    
    // Voice Recognition States
    const [isRecording, setIsRecording] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [processingVoice, setProcessingVoice] = useState(false);
    const [autoFilledFields, setAutoFilledFields] = useState({});
    const recognitionRef = useRef(null);
    

    
    // New states for Location Search UX
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [readableAddress, setReadableAddress] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length > 2 && searchQuery !== readableAddress) {
                handleSearch(true);
            }
        }, 800);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async (isSilent = false) => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        if (!isSilent) setIsSearching(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data);
            if (res.data.length > 0) setShowDropdown(true);
        } catch (err) {
            console.error("Location search failed", err);
            if (!isSilent) toast.error("Failed to search location.");
        } finally {
            if (!isSilent) setIsSearching(false);
        }
    };

    const updateReadableAddress = async (lat, lng) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.data && res.data.display_name) {
                setReadableAddress(res.data.display_name);
                setForm(prev => ({ ...prev, location: res.data.display_name }));
                setSearchQuery(''); 
                setShowDropdown(false);
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        }
    };

    const handleUseMyLocation = () => {
        if ("geolocation" in navigator) {
            setIsSearching(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const newPos = { lat, lng };
                    setPosition(newPos);
                    updateReadableAddress(lat, lng);
                    setIsSearching(false);
                },
                (err) => {
                    console.error(err);
                    if (err.code === 1) toast.error("Please allow location access in your browser.");
                    else toast.error("Unable to get current location.");
                    setIsSearching(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            toast.error("Geolocation is not supported by your browser.");
        }
    };

    const handleSelectLocation = (result) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition({ lat, lng });
        setReadableAddress(result.display_name);
        setForm(prev => ({ ...prev, location: result.display_name }));
        setSearchQuery('');
        setShowDropdown(false);
        setSearchResults([]);
    };

    // --- Voice Processing Logic ---
    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech recognition is not supported in this browser.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = i18n.language === 'ta' ? 'ta-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-US';

        recognitionRef.current.onresult = (event) => {
            let fullTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setVoiceTranscript(fullTranscript);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
            toast.error("Voice detection failed. Please try again.");
        };

        setVoiceTranscript("");
        setIsRecording(true);
        recognitionRef.current.start();
    };

    const stopRecording = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);

        const currentTranscript = voiceTranscript.trim();
        if (currentTranscript.length < 5) {
            toast.warning("Please speak more to describe your issue.");
            return;
        }

        setProcessingVoice(true);
        try {
            const res = await axios.post("/api/voice/process-transcript", { transcript: currentTranscript });
            
            // Handle both response formats
            const data = res.data?.extractedData || res.data || {};
            
            console.log("✅ Voice API Response:", res.data);
            console.log("✅ Extracted data:", data);

            // Track which fields were auto-filled
            const filledFields = {};
            
            if (data.title) {
                const cleanTitle = String(data.title).trim();
                if (cleanTitle) {
                    setForm(prev => ({ ...prev, title: cleanTitle }));
                    filledFields.title = true;
                }
            }
            
            if (data.description) {
                const cleanDesc = String(data.description).trim();
                if (cleanDesc) {
                    setForm(prev => ({ ...prev, description: cleanDesc }));
                    filledFields.description = true;
                }
            }
            
            if (data.category) {
                const cleanCat = String(data.category).trim();
                if (cleanCat) {
                    setForm(prev => ({ ...prev, category: cleanCat }));
                    filledFields.category = true;
                }
            }
            
            if (data.location) {
                const cleanLoc = String(data.location).trim();
                if (cleanLoc) {
                    setForm(prev => ({ ...prev, location: cleanLoc }));
                    setSearchQuery(cleanLoc);
                    filledFields.location = true;
                }
            }
            
            setAutoFilledFields(filledFields);
            
            // Clear auto-fill highlights after 5 seconds
            setTimeout(() => setAutoFilledFields({}), 5000);

            const filledCount = Object.keys(filledFields).length;
            if (filledCount > 0) {
                toast.success(`Form auto-filled! ${filledCount} field(s) extracted from your voice. ✨`);
            } else {
                toast.info("Could not extract fields. Please type manually.");
            }
        } catch (err) {
            console.error("❌ Voice processing failed:", err);
            console.error("Error response:", err.response?.data);
            
            // Try to use basic extraction even on error
            if (currentTranscript) {
                const basicTitle = currentTranscript.split(' ').slice(0, 6).join(' ');
                setForm(prev => ({
                    ...prev,
                    title: basicTitle || prev.title,
                    description: currentTranscript || prev.description
                }));
                toast.info("Basic extraction applied. Please review and edit.");
            } else {
                toast.error("Failed to process voice. Please enter details manually.");
            }
        } finally {
            setProcessingVoice(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Clear duplicate warning when user edits the form
        if (duplicateInfo) {
            setDuplicateInfo(null);
            setUpvoteDone(false);
        }
        if (name === 'title') {
            const v = value.toLowerCase();
            let autoCategory = form.category;
            if (v.includes('garbage') || v.includes('trash') || v.includes('waste') || v.includes('dustbin') || v.includes('dump')) {
                autoCategory = 'Garbage';
            } else if (v.includes('water') || v.includes('leak') || v.includes('pipe') || v.includes('supply') || v.includes('tap')) {
                autoCategory = 'Water';
            } else if (v.includes('streetlight') || v.includes('bulb') || v.includes('light')) {
                autoCategory = 'Streetlight';
            } else if (v.includes('drain') || v.includes('sewage') || v.includes('flood') || v.includes('overflow') || v.includes('gutter')) {
                autoCategory = 'Drainage';
            } else if (v.includes('road') || v.includes('pothole') || v.includes('street') || v.includes('crack')) {
                autoCategory = 'Road';
            }
            setForm({ ...form, title: value, category: autoCategory });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };



    // Step 1: Run duplicate check before submitting
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setDuplicateInfo(null);
        setUpvoteDone(false);

        // --- Duplicate Check ---
        setCheckingDuplicate(true);
        try {
            const checkRes = await axios.post("/api/complaints/check-duplicate", {
                title: form.title,
                description: form.description,
                location: form.location
            });
            if (checkRes.data.duplicate) {
                setDuplicateInfo({
                    existingComplaintId: checkRes.data.existingComplaintId,
                    existingComplaintRef: checkRes.data.existingComplaintRef,
                    existingTitle: checkRes.data.existingTitle
                });
                setCheckingDuplicate(false);
                return; // Stop — show the warning banner
            }
        } catch (dupErr) {
            // If duplicate check itself fails, proceed silently
            console.warn("Duplicate check failed, proceeding with submission:", dupErr.message);
        } finally {
            setCheckingDuplicate(false);
        }
        // --- If no duplicate, submit ---
        await doSubmit();
    };

    // Step 2: Actual complaint submission
    const doSubmit = async () => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", form.title);
            formData.append("category", form.category);
            formData.append("description", form.description);
            formData.append("location", form.location);
            if (position) {
                formData.append("lat", position.lat);
                formData.append("lng", position.lng);
            }
            if (image) formData.append("image", image);

            await axios.post("/api/complaints", formData);
            // Reset form
            setForm({ title: "", category: "", description: "", location: "" });
            setImage(null);
            setPosition(null);
            setReadableAddress("");
            setSearchQuery("");
            setDuplicateInfo(null);
            setUpvoteDone(false);
            if (onComplaintAdded) onComplaintAdded();
            toast.success(t('complaintSuccess', 'Complaint submitted successfully'));
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Error submitting complaint. Please try again or check backend.";
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    // Upvote the existing complaint instead of submitting a new one
    const handleUpvoteExisting = async () => {
        if (!duplicateInfo?.existingComplaintId) return;
        setUpvoting(true);
        try {
            await axios.post(`/api/complaints/${duplicateInfo.existingComplaintId}/upvote`);
            setUpvoteDone(true);
            toast.success('👍 Upvote added to the existing complaint!');
            if (onComplaintAdded) onComplaintAdded();
        } catch (err) {
            console.error(err);
            toast.error('Failed to upvote. Please try again.');
        } finally {
            setUpvoting(false);
        }
    };

    return (
        <div className="form-container glass-panel animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>{t('submitComplaintTitle', 'Submit a New Complaint')}</h2>
                
                {/* Voice Control Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        color: isRecording ? '#ff4081' : 'var(--text-muted)',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        {isRecording ? "Stop Speaking" : "Start Speaking"}
                    </span>
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`mic-btn ${isRecording ? 'recording' : ''}`}
                            title={isRecording ? "Stop Recording" : "Speak your complaint"}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                border: 'none',
                                background: isRecording ? '#ff4081' : 'rgba(255, 255, 255, 0.08)',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isRecording ? '0 0 20px rgba(255, 64, 129, 0.6)' : '0 2px 10px rgba(0,0,0,0.1)',
                                zIndex: 10
                            }}
                        >
                            {isRecording ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            )}
                        </button>
                        {isRecording && <div className="pulse-ring"></div>}
                    </div>
                </div>
            </div>

            {/* Voice Feedback Overlay */}
            {(isRecording || voiceTranscript || processingVoice) && (
                <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '1.2rem',
                    marginBottom: '1.5rem',
                    animation: 'fadeSlideIn 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: processingVoice ? '#2196f3' : isRecording ? '#ff4081' : '#4caf50',
                            animation: (isRecording || processingVoice) ? 'pulse 1.5s infinite' : 'none'
                        }}></span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                            {processingVoice ? '📝 AI is extracting details...' : isRecording ? '🎤 Listening to your voice...' : '✅ Transcript captured'}
                        </span>
                    </div>
                    
                    <div style={{ 
                        fontSize: '1rem', 
                        lineHeight: '1.5', 
                        color: 'var(--text-primary)',
                        minHeight: '1.5rem',
                        fontStyle: 'italic',
                        opacity: isRecording ? 0.9 : 0.7
                    }}>
                        {voiceTranscript || "Start speaking to describe your issue..."}
                    </div>

                    {isRecording && (
                        <div style={{ display: 'flex', gap: '3px', marginTop: '12px', height: '20px', alignItems: 'center' }}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: '500' }}>{error}</div>}

            {/* ── Duplicate Warning Banner ── */}
            {duplicateInfo && !upvoteDone && (
                <div id="duplicate-warning-banner" style={{
                    background: 'linear-gradient(135deg, rgba(255,152,0,0.12), rgba(255,87,34,0.1))',
                    border: '1.5px solid rgba(255,152,0,0.55)',
                    borderRadius: '14px',
                    padding: '1.1rem 1.3rem',
                    marginBottom: '1.2rem',
                    animation: 'fadeSlideIn 0.35s ease',
                    boxShadow: '0 4px 18px rgba(255,152,0,0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.55rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                        <strong style={{ fontSize: '1rem', color: '#e65100' }}>This issue is already reported</strong>
                    </div>
                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        A similar complaint <strong style={{ color: 'var(--text-primary)' }}>({duplicateInfo.existingComplaintRef})</strong> already exists:
                    </p>
                    <p style={{ margin: '0 0 0.9rem 0', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                        &ldquo;{duplicateInfo.existingTitle}&rdquo;
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            id="upvote-existing-btn"
                            type="button"
                            onClick={handleUpvoteExisting}
                            disabled={upvoting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.45rem',
                                padding: '0.6rem 1.1rem',
                                background: 'linear-gradient(135deg, #ff9800, #f44336)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                cursor: upvoting ? 'not-allowed' : 'pointer',
                                opacity: upvoting ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 10px rgba(255,152,0,0.35)'
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>👍</span>
                            {upvoting ? 'Upvoting...' : 'Upvote Existing Complaint'}
                        </button>
                        <button
                            id="submit-anyway-btn"
                            type="button"
                            onClick={doSubmit}
                            disabled={loading}
                            style={{
                                padding: '0.6rem 1.1rem',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '0.87rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit Anyway'}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setDuplicateInfo(null); setUpvoteDone(false); }}
                            style={{
                                padding: '0.6rem 0.8rem',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            ✕ Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* ── Upvote Success Banner ── */}
            {upvoteDone && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(76,175,80,0.12), rgba(56,142,60,0.1))',
                    border: '1.5px solid rgba(76,175,80,0.5)',
                    borderRadius: '14px',
                    padding: '1.1rem 1.3rem',
                    marginBottom: '1.2rem',
                    animation: 'fadeSlideIn 0.35s ease',
                    boxShadow: '0 4px 18px rgba(76,175,80,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <span style={{ fontSize: '1.6rem' }}>✅</span>
                    <div>
                        <strong style={{ color: '#2e7d32', fontSize: '0.97rem' }}>Upvote registered!</strong>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Thank you! Your support helps prioritise <strong>{duplicateInfo?.existingComplaintRef}</strong> faster.
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('title', 'Title')}
                        {autoFilledFields.title && <span style={{ fontSize: '0.7rem', background: 'var(--success)', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>✨ Auto-filled</span>}
                    </label>
                    <input
                        type="text"
                        name="title"
                        placeholder={t('titlePlaceholder', 'E.g. Broken Streetlight')}
                        value={form.title}
                        onChange={handleChange}
                        required
                        style={autoFilledFields.title ? { borderColor: 'var(--success)', boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)' } : {}}
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('category', 'Category')}
                        {autoFilledFields.category && <span style={{ fontSize: '0.7rem', background: 'var(--success)', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>✨ Auto-filled</span>}
                    </label>
                    <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                        className="input-modern"
                        style={autoFilledFields.category ? { borderColor: 'var(--success)', boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)' } : {}}
                    >
                        <option value="" disabled>{t('selectCategory', 'Select Category...')}</option>
                        <option value="Road">{t('road', 'Road')}</option>
                        <option value="Garbage">{t('garbage', 'Garbage')}</option>
                        <option value="Water">{t('water', 'Water')}</option>
                        <option value="Streetlight">{t('streetlight', 'Streetlight')}</option>
                        <option value="Drainage">{t('drainage', 'Drainage')}</option>
                        <option value="Other">{t('other', 'Other')}</option>
                    </select>
                </div>

                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('description', 'Description')}
                        {autoFilledFields.description && <span style={{ fontSize: '0.7rem', background: 'var(--success)', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>✨ Auto-filled</span>}
                    </label>
                    <textarea
                        name="description"
                        placeholder={t('descPlaceholder', 'Provide details about the issue...')}
                        value={form.description}
                        onChange={handleChange}
                        rows="3"
                        required
                        style={autoFilledFields.description ? { borderColor: 'var(--success)', boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)' } : {}}
                    />
                </div>

                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t('locationDetails', 'Location Details')}
                        {autoFilledFields.location && <span style={{ fontSize: '0.7rem', background: 'var(--success)', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontWeight: 'bold' }}>✨ Auto-filled</span>}
                    </label>
                    <input
                        type="text"
                        name="location"
                        placeholder={t('locationPlaceholder', 'E.g. Main St, Downtown (Type or select from map)')}
                        value={form.location}
                        onChange={handleChange}
                        required
                        style={autoFilledFields.location ? { borderColor: 'var(--success)', boxShadow: '0 0 8px rgba(76, 175, 80, 0.3)' } : {}}
                    />
                </div>

                <div className="input-group">
                    <label>{t('photoOptional', 'Current Status Photo (Optional)')}</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ padding: '0.5rem 0' }}
                    />
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label>{t('pinLocation', 'Pin Exact Location')}</label>
                    
                    <div className="location-search-container" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative' }}>
                        <div style={{ flex: '1', display: 'flex', minWidth: '200px', border: '1px solid var(--glass-border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--glass-bg)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                            <input
                                type="text"
                                placeholder={t('searchLocation', 'Search for a location...')}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.trim() === '') {
                                        setShowDropdown(false);
                                        setSearchResults([]);
                                    }
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(false); } }}
                                style={{ flex: '1', border: 'none', padding: '0.75rem 1rem', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem' }}
                            />
                            <button 
                                type="button" 
                                onClick={() => handleSearch(false)}
                                style={{ padding: '0 1rem', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s ease' }}
                                disabled={isSearching}
                                title="Search Location"
                            >
                                {isSearching ? <span style={{fontSize: '1.2rem', display: 'inline-block', animation: 'spin 1s linear infinite'}}>↻</span> : <SearchIcon />}
                            </button>
                        </div>
                        <button 
                            type="button"
                            onClick={handleUseMyLocation}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                            disabled={isSearching}
                            onMouseEnter={(e) => { if(!isSearching) { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; } }}
                            onMouseLeave={(e) => { if(!isSearching) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; } }}
                        >
                            <LocationIcon /> {isSearching ? t('locating', "Locating...") : t('useLocation', "Use My Location")}
                        </button>
                        
                        {showDropdown && searchResults.length > 0 && (
                            <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'var(--bg-card, #fff)', border: '1px solid var(--glass-border)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', listStyle: 'none', padding: 0, margin: '0.5rem 0 0 0', maxHeight: '250px', overflowY: 'auto' }}>
                                {searchResults.map(result => (
                                   <li 
                                       key={result.place_id} 
                                       onClick={() => handleSelectLocation(result)} 
                                       style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                       onMouseEnter={(e) => { e.target.style.background = 'var(--glass-hover, rgba(0,0,0,0.05))'; }}
                                       onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
                                   >
                                       {result.display_name}
                                   </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {readableAddress && (
                        <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'calc(var(--primary) * 0.1)', borderLeft: '4px solid var(--primary)', borderRadius: '4px', fontSize: '0.9rem' }}>
                            <strong style={{ color: 'var(--primary)' }}>{t('selectedLocation', 'Selected Location:')}</strong> {readableAddress}
                        </div>
                    )}

                    <div style={{ height: '300px', width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                        <MapContainer center={position || [20.5937, 78.9629]} zoom={position ? 15 : 5} minZoom={4} maxBounds={[[6.7, 68.1], [37.1, 97.4]]} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationMarker position={position} setPosition={setPosition} updateAddress={updateReadableAddress} />
                        </MapContainer>
                    </div>
                    <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>{t('mapHelpText', 'Click on the map to manually drop or move the pin.')}</p>
                </div>

                {/* Submit Button — shows checking state */}
                <button
                    id="submit-complaint-btn"
                    type="submit"
                    className="btn-primary"
                    disabled={loading || checkingDuplicate}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    {checkingDuplicate && (
                        <span style={{ fontSize: '1rem', display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span>
                    )}
                    {checkingDuplicate
                        ? 'Checking for duplicates...'
                        : loading
                        ? t('submitting', 'Submitting...')
                        : t('submitComplaint', 'Submit Complaint')}
                </button>
            </form>

            {/* Inline keyframe animation styles */}
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes voiceWave {
                    0% { height: 4px; }
                    50% { height: 18px; }
                    100% { height: 4px; }
                }
                .pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 48px;
                    height: 48px;
                    border: 2px solid #ff4081;
                    border-radius: 50%;
                    animation: ringPulse 2s infinite;
                    pointer-events: none;
                }
                @keyframes ringPulse {
                    0% { width: 48px; height: 48px; opacity: 0.8; }
                    100% { width: 85px; height: 85px; opacity: 0; }
                }
                .mic-btn:hover {
                    transform: scale(1.1);
                    filter: brightness(1.2);
                }
                .voice-bar {
                    width: 3px;
                    height: 6px;
                    background: var(--primary);
                    border-radius: 2px;
                    animation: voiceWave 1s infinite ease-in-out;
                }
                }
            `}</style>
        </div>
    );
};

export default ComplaintForm;
