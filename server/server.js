console.log("🔥 SERVER FILE LOADED");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

require('dotenv').config();

// import models
const Complaint = require("./models/Complaint");
const User = require("./models/User");
const Message = require("./models/Message");
const Zone = require("./models/Zone");
const { verifyToken, verifyAdmin } = require("./middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("./middleware/upload");

// import email service
const { sendWelcomeEmail, sendComplaintEmail, sendStatusUpdateEmail, sendOTPEmail } = require("./services/emailService");

// Multer with memory storage for AI image analysis
const multer = require("multer");
const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const fs = require('fs');
const PDFDocument = require('pdfkit');
const locales = {
    en: JSON.parse(fs.readFileSync(path.join(__dirname, './locales/en.json'), 'utf8')),
    ta: JSON.parse(fs.readFileSync(path.join(__dirname, './locales/ta.json'), 'utf8')),
    hi: JSON.parse(fs.readFileSync(path.join(__dirname, './locales/hi.json'), 'utf8')),
};
const getT = (req) => {
    const lang = req.headers['accept-language'] || 'en';
    return locales[lang] || locales.en;
};

// OpenAI Setup
const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// JWT Secret (in production use dotenv, using a hardcoded one for simplicity)
const JWT_SECRET = "nexacivic_super_secret_key";
const otpStore = {}; // Temporary in-memory OTP store (email: {otp, userData, expiresAt})

// Point System Configuration
const POINTS_CONFIG = {
    complaint_created: 10,
    complaint_resolved: 5,
    engagement: 2,
    feedback_given: 3,
    upvote_received: 1
};

// Badge System Configuration
const BADGES_CONFIG = {
    beginner: { threshold: 0, name: 'Beginner', icon: '🌱' },
    active: { threshold: 50, name: 'Active User', icon: '⭐' },
    contributor: { threshold: 100, name: 'Contributor', icon: '🌟' },
    top_contributor: { threshold: 200, name: 'Top Contributor', icon: '🏆' },
    champion: { threshold: 500, name: 'Champion', icon: '👑' }
};

function calculateBadges(points) {
    const earned = [];
    const thresholds = Object.entries(BADGES_CONFIG)
        .sort((a, b) => b[1].threshold - a[1].threshold);

    for (const [key, badge] of thresholds) {
        if (points >= badge.threshold) {
            earned.push(badge.name);
            break;
        }
    }

    if (points >= 50) earned.push('Active User');
    else if (points >= 1) earned.push('Beginner');

    return [...new Set(earned)];
}

function getUserBadge(points) {
    if (points >= 500) return { name: 'Champion', icon: '👑', tier: 'gold' };
    if (points >= 200) return { name: 'Top Contributor', icon: '🏆', tier: 'gold' };
    if (points >= 100) return { name: 'Contributor', icon: '🌟', tier: 'silver' };
    if (points >= 50) return { name: 'Active User', icon: '⭐', tier: 'bronze' };
    return { name: 'Beginner', icon: '🌱', tier: 'starter' };
}

function getNextBadgeProgress(points) {
    const thresholds = [
        { threshold: 50, name: 'Active User', icon: '⭐' },
        { threshold: 100, name: 'Contributor', icon: '🌟' },
        { threshold: 200, name: 'Top Contributor', icon: '🏆' },
        { threshold: 500, name: 'Champion', icon: '👑' }
    ];

    for (const badge of thresholds) {
        if (points < badge.threshold) {
            return {
                nextBadge: badge,
                progress: Math.round((points / badge.threshold) * 100),
                pointsNeeded: badge.threshold - points
            };
        }
    }
    return null;
}

// POST API: Add Points
app.post("/api/points/add", verifyToken, async (req, res) => {
    try {
        const { action } = req.body;
        const userId = req.user.id;

        if (!action || !POINTS_CONFIG.hasOwnProperty(action)) {
            return res.status(400).json({ error: "Invalid action type" });
        }

        const pointsToAdd = POINTS_CONFIG[action];
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const previousPoints = user.points || 0;
        user.points = previousPoints + pointsToAdd;

        const newBadges = calculateBadges(user.points);
        const previousBadges = user.badges || [];

        const newBadgeEarned = newBadges.find(b => !previousBadges.includes(b));

        user.badges = newBadges;
        await user.save();

        res.json({
            success: true,
            pointsAdded: pointsToAdd,
            totalPoints: user.points,
            newBadge: newBadgeEarned || null,
            currentBadge: getUserBadge(user.points),
            nextBadgeProgress: getNextBadgeProgress(user.points)
        });
    } catch (err) {
        console.error("❌ Error adding points:", err);
        res.status(500).json({ error: "Error adding points" });
    }
});

// GET API: Get User Points and Stats
app.get("/api/points/me", verifyToken, async (req, res) => {
    try {
        console.log("⭐ Fetching user points for:", req.user.id);
        const user = await User.findById(req.user.id);

        if (!user) {
            console.log("❌ User not found");
            return res.status(404).json({ error: "User not found" });
        }

        console.log("⭐ User found, points:", user.points, "badges:", user.badges);

        const userComplaints = await Complaint.find({ userId: user._id });
        const complaintsCreated = userComplaints.length;
        const complaintsResolved = userComplaints.filter(c => c.status === 'Resolved').length;

        res.json({
            points: user.points || 0,
            badges: user.badges || [],
            currentBadge: getUserBadge(user.points || 0),
            nextBadgeProgress: getNextBadgeProgress(user.points || 0),
            stats: {
                complaintsCreated,
                complaintsResolved
            }
        });
    } catch (err) {
        console.error("❌ Error fetching points:", err);
        res.status(500).json({ error: "Error fetching points" });
    }
});

// GET API: Leaderboard
app.get("/api/leaderboard", async (req, res) => {
    try {
        console.log("📊 Fetching leaderboard...");
        const { limit = 10 } = req.query;

        const users = await User.find({ role: 'user' })
            .select('name points badges')
            .sort({ points: -1 })
            .limit(parseInt(limit));

        console.log(`📊 Found ${users.length} users for leaderboard`);

        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            userId: user._id,
            name: user.name,
            points: user.points || 0,
            badge: getUserBadge(user.points || 0),
            isTopThree: index < 3
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error("❌ Error fetching leaderboard:", err);
        res.status(500).json({ error: "Error fetching leaderboard" });
    }
});

// connect MongoDB
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ MongoDB Connected");

        // Seed Admin User
        try {
            const adminExists = await User.findOne({ email: 'admin@nexacivic.com' });
            if (!adminExists) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);
                await User.create({
                    name: 'System Admin',
                    email: 'admin@nexacivic.com',
                    password: hashedPassword,
                    role: 'admin'
                });
                console.log("✅ Admin user seeded (admin@nexacivic.com / admin123)");
            }

            // Seed Staff Users
            const staffList = [
                { name: 'Road Inspector', email: 'staff1@nexacivic.com' },
                { name: 'Sanitation Department', email: 'staff2@nexacivic.com' },
                { name: 'Water Department', email: 'staff3@nexacivic.com' },
                { name: 'Electricity Board', email: 'staff4@nexacivic.com' },
                { name: 'General Maintenance', email: 'staff5@nexacivic.com' }
            ];

            for (const staff of staffList) {
                const staffExists = await User.findOne({ email: staff.email });
                if (!staffExists) {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash('admin123', salt);
                    await User.create({
                        name: staff.name,
                        email: staff.email,
                        password: hashedPassword,
                        role: 'staff'
                    });
                    console.log(`✅ Staff user seeded (${staff.email} / admin123)`);
                } else if (staffExists.name !== staff.name) {
                    staffExists.name = staff.name;
                    await staffExists.save();
                    console.log(`✅ Staff user name updated to ${staff.name} (${staff.email})`);
                }
            }
        } catch (err) {
            console.log("❌ Error seeding users:", err);
        }
    })
    .catch(err => console.log("❌ Mongo Error:", err));

// test route
app.get("/", (req, res) => {
    res.send("API is running");
});

// Auth: Send Email OTP (2-Step Registration)
app.post("/api/otp/send-email-otp", async (req, res) => {
    try {
        const { name, email, password, mobile, role } = req.body;

        if (!name || !email || !password || !mobile) {
            return res.status(400).json({ error: "Please complete all fields" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ error: "Email already registered" });

        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) return res.status(400).json({ error: "Mobile number already registered" });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP + User Data temporarily
        otpStore[email] = {
            otp,
            userData: { name, email, password, mobile, role },
            expiresAt
        };

        // Send OTP Email
        await sendOTPEmail(email, otp);

        res.json({ message: "OTP sent to your email. Please verify." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error during OTP generation" });
    }
});

// Auth: Verify Email OTP & Finalize Registration
app.post("/api/otp/verify-email-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

        const entry = otpStore[email];

        if (!entry) return res.status(400).json({ error: "OTP session not found. Please restart registration." });

        if (Date.now() > entry.expiresAt) {
            delete otpStore[email];
            return res.status(400).json({ error: "OTP expired. Please request a new one." });
        }

        if (entry.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // OTP is valid! Proceed with User creation
        const { name, password, mobile, role } = entry.userData;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            mobile,
            role: role || 'user',
            language: req.headers['accept-language'] || 'en'
        });

        await user.save();

        // Cleanup OTP store
        delete otpStore[email];

        // Send Welcome Email
        await sendWelcomeEmail(user.name, user.email, user.language);

        res.json({ message: getT(req).reg_success });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error during verification" });
    }
});

// Auth: Login User
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: getT(req).reg_error });

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: getT(req).invalid_creds });

        // Check password matching
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: getT(req).invalid_creds });

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

        res.json({
            message: getT(req).login_success,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, language: user.language }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during login" });
    }
});

// Update user language preference
app.put("/api/user/language", verifyToken, async (req, res) => {
    try {
        const { language } = req.body;
        if (!['en', 'ta', 'hi'].includes(language)) {
            return res.status(400).json({ error: "Unsupported language" });
        }
        await User.findByIdAndUpdate(req.user.id, { language });
        res.json({ message: "Language updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating language" });
    }
});

// Wrapper to properly catch and log multer errors
const uploadSingleImage = (req, res, next) => {
    upload.single("image")(req, res, function (err) {
        if (err) {
            console.error("❌ Multer error:", err);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

// AI Spam Detection Function
async function checkSpam(title, description, location) {
    const combinedText = `Title: ${title}\nDescription: ${description}\nLocation: ${location}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // fast and efficient model
            messages: [
                { role: "system", content: "You are a civic complaint spam detector. Classify the given text as SPAM or VALID. Spam only includes: completely meaningless content, random repeated characters (e.g., 'aaaaaaa'), obvious test messages like 'test test test', or obvious scams/ads. Standard civic complaints about infrastructure, roads, water, garbage, or public services are ALWAYS valid. Respond with exactly one word: SPAM or VALID." },
                { role: "user", content: combinedText }
            ],
            max_tokens: 10,
            temperature: 0
        });
        const result = response.choices[0].message.content.trim().toUpperCase();
        console.log("🤖 AI Classification Result:", result); // Debug log
        if (result.includes("SPAM")) return "SPAM";
        return "VALID";
    } catch (error) {
        console.error("❌ OpenAI API Error:", error.message || error);

        // Fallback rule-based spam detection when API is unavailable or quota exceeded
        console.log("⚠️ Falling back to basic rule-based spam detection...");

        const titleLower = (title || "").toLowerCase();
        const descLower = (description || "").toLowerCase();
        const textToCheck = `${titleLower} ${descLower}`; // Exclude location and labels from fallback check

        // Rule 1: Check for repeated characters (e.g., 'aaaaaaa', '111111')
        if (/(.)\1{4,}/.test(textToCheck)) {
            console.log("🤖 Fallback Classification Result: SPAM (Repeated characters detected)");
            return "SPAM";
        }

        // Rule 2: Check for obvious test or garbage words
        const spamKeywords = ["test test", "asdfasdf", "dummy data", "qweqwe", "test spam", "abcd"];
        for (let keyword of spamKeywords) {
            if (textToCheck.includes(keyword)) {
                console.log(`🤖 Fallback Classification Result: SPAM (Matched keyword: ${keyword})`);
                return "SPAM";
            }
        }

        // Rule 3: Check if text consists mostly of numbers/symbols without enough real letters
        // Remove spaces, punctuation, numbers to count pure alphabet
        const lettersMatch = textToCheck.match(/[a-z]/g);
        const letterCount = lettersMatch ? lettersMatch.length : 0;

        // If the pure letter count is extremely low in both title and description combined
        if (letterCount < 10) {
            console.log("🤖 Fallback Classification Result: SPAM (Too few alphabet letters, likely meaningless keyboard mash)");
            return "SPAM";
        }

        console.log("🤖 Fallback Classification Result: VALID");
        return "VALID"; // On API error and no fallback rules triggered, allow through
    }
}

// AI Duplicate Complaint Detection Function
async function checkDuplicate(newComplaintText) {
    try {
        // Fetch last 75 complaints (title + description + location only)
        const recentComplaints = await Complaint.find({})
            .sort({ createdAt: -1 })
            .limit(75)
            .select('_id complaintId title description location');

        if (!recentComplaints || recentComplaints.length === 0) {
            return { duplicate: false };
        }

        // Loop and compare one by one, stop on first duplicate
        for (const existing of recentComplaints) {
            const existingText = `Title: ${existing.title}\nDescription: ${existing.description}\nLocation: ${existing.location || 'N/A'}`;
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: `Compare the following two civic complaints and determine if they refer to the same issue.\n\nComplaint 1:\n${newComplaintText}\n\nComplaint 2:\n${existingText}\n\nReturn ONLY one of:\n- DUPLICATE\n- NOT_DUPLICATE`
                        }
                    ],
                    max_tokens: 10,
                    temperature: 0
                });

                const result = response.choices[0].message.content.trim().toUpperCase();
                console.log(`🔍 Duplicate check vs ${existing.complaintId}: ${result}`);

                if (result.includes("DUPLICATE")) {
                    return {
                        duplicate: true,
                        message: "Similar complaint already exists",
                        existingComplaintId: existing._id.toString(),
                        existingComplaintRef: existing.complaintId,
                        existingTitle: existing.title
                    };
                }
            } catch (aiErr) {
                // If a single OpenAI call fails, skip that complaint and continue
                console.error(`⚠️ AI error comparing with ${existing.complaintId}:`, aiErr.message);
            }
        }

        return { duplicate: false };
    } catch (err) {
        console.error("❌ checkDuplicate error:", err.message);
        // On total failure, allow complaint through — don't block the system
        return { duplicate: false, aiError: true };
    }
}

// POST API: Check for Duplicate Complaint - SECURED
app.post("/api/complaints/check-duplicate", verifyToken, async (req, res) => {
    try {
        const { title, description, location } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: "Title and description are required for duplicate check." });
        }

        const newComplaintText = `Title: ${title}\nDescription: ${description}\nLocation: ${location || 'N/A'}`;

        console.log("🔍 Running duplicate check...");
        const result = await checkDuplicate(newComplaintText);

        if (result.duplicate) {
            console.log(`⚠️ Duplicate detected: matches ${result.existingComplaintRef}`);
            return res.json({
                duplicate: true,
                message: "Similar complaint already exists",
                existingComplaintId: result.existingComplaintId,
                existingComplaintRef: result.existingComplaintRef,
                existingTitle: result.existingTitle
            });
        }

        return res.json({ duplicate: false });
    } catch (err) {
        console.error("❌ Duplicate Check API Error:", err);
        // Fail open — allow complaint submission if AI check fails
        return res.json({ duplicate: false, aiError: true });
    }
});

// AI Voice Transcript Extraction Helper
async function processVoiceTranscript(transcript) {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ OpenAI API key not configured, using fallback");
        return null;
    }

    try {
        console.log("🔊 Processing transcript:", transcript.substring(0, 100));

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant that extracts structured civic complaint data. Return ONLY valid JSON."
                },
                {
                    role: "user",
                    content: `Extract complaint details from this text and return ONLY valid JSON:

Text: "${transcript}"

JSON format:
{"title":"short headline","description":"detailed description","category":"Road/Garbage/Water/Streetlight/Drainage/Other","location":"address if mentioned"}

Return ONLY the JSON, nothing else.`
                }
            ],
            max_tokens: 200,
            temperature: 0.2
        });

        const content = response.choices[0].message.content.trim();
        console.log("🔊 AI Raw Response:", content);

        // Try to parse JSON, remove markdown if present
        let cleanContent = content;
        if (content.includes('```')) {
            cleanContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        }

        const result = JSON.parse(cleanContent);
        return result;
    } catch (err) {
        console.error("❌ processVoiceTranscript error:", err.message);
        return null;
    }
}

// Helper function to extract category from text
function extractCategoryFromText(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('pothole') || lowerText.includes('road') || lowerText.includes('street') || lowerText.includes('crack') || lowerText.includes('traffic')) {
        return 'Road';
    }
    if (lowerText.includes('garbage') || lowerText.includes('trash') || lowerText.includes('waste') || lowerText.includes('dustbin')) {
        return 'Garbage';
    }
    if (lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('pipe') || lowerText.includes('supply') || lowerText.includes('tap')) {
        return 'Water';
    }
    if (lowerText.includes('light') || lowerText.includes('bulb') || lowerText.includes('electric') || lowerText.includes('power')) {
        return 'Streetlight';
    }
    if (lowerText.includes('drain') || lowerText.includes('sewage') || lowerText.includes('flood') || lowerText.includes('mosquito')) {
        return 'Drainage';
    }
    return 'Other';
}

// Helper function to create fallback extraction
function createFallbackExtraction(transcript) {
    const words = transcript.trim().split(/\s+/);
    const title = words.slice(0, 6).join(' ');
    const location = extractLocationFromText(transcript);

    return {
        title: title,
        description: transcript,
        category: extractCategoryFromText(transcript),
        location: location,
        priority: 'Medium'
    };
}

// Helper function to extract location from text
function extractLocationFromText(text) {
    const locationPatterns = [
        /near\s+(.+?)(?:\s+in|\s+on|,|\.|$)/i,
        /at\s+(.+?)(?:\s+in|\s+on|,|\.|$)/i,
        /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
        /,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:area|road|street)/i
    ];

    for (const pattern of locationPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return '';
}

// POST API: Process Voice Transcript - SECURED
app.post("/api/voice/process-transcript", verifyToken, async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: "Transcript is required." });
        }

        const cleanTranscript = transcript.trim();
        if (cleanTranscript.length < 5) {
            return res.status(400).json({ error: "Transcript is too short." });
        }

        console.log("🔊 Processing voice transcript for user:", req.user.id);
        console.log("🔊 Original transcript:", cleanTranscript);

        // Try AI processing first
        let aiResult = null;
        try {
            aiResult = await processVoiceTranscript(cleanTranscript);
        } catch (aiErr) {
            console.log("⚠️ AI processing failed, using fallback:", aiErr.message);
        }

        let extractedData;

        if (aiResult && aiResult.title) {
            // AI succeeded
            extractedData = {
                title: aiResult.title || "",
                description: aiResult.description || cleanTranscript,
                category: aiResult.category || extractCategoryFromText(cleanTranscript),
                location: aiResult.location || extractLocationFromText(cleanTranscript),
                priority: aiResult.priority || "Medium"
            };
            console.log("🔊 AI Extracted data:", extractedData);
        } else {
            // Use fallback extraction
            extractedData = createFallbackExtraction(cleanTranscript);
            console.log("🔊 Fallback Extracted data:", extractedData);
        }

        res.json({
            success: true,
            message: "Voice processed successfully",
            extractedData
        });
    } catch (err) {
        console.error("❌ Voice Transcript API Error:", err);
        // Return fallback even on error
        const fallback = createFallbackExtraction(req.body.transcript || '');
        res.json({
            success: true,
            message: "Processed with basic extraction",
            extractedData: fallback
        });
    }
});

// POST API: Parse Complaint Text (for AI parsing of typed text) - SECURED
app.post("/api/ai/parse-complaint", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length < 5) {
            return res.status(400).json({ error: "Text is required and must be at least 5 characters." });
        }

        const cleanText = text.trim();
        console.log("🤖 Parsing complaint text:", cleanText.substring(0, 100));

        // Try AI parsing
        let aiResult = null;

        if (process.env.OPENAI_API_KEY) {
            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "Extract complaint data from text. Return ONLY valid JSON."
                        },
                        {
                            role: "user",
                            content: `Extract: "${cleanText}"
JSON: {"title":"headline","description":"details","category":"Road/Garbage/Water/Streetlight/Drainage/Other","location":"address"}`
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.2
                });

                const content = response.choices[0].message.content.trim();
                let cleanContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                aiResult = JSON.parse(cleanContent);
                console.log("🤖 AI Parsed result:", aiResult);
            } catch (aiErr) {
                console.log("⚠️ AI parsing failed:", aiErr.message);
            }
        }

        let result;
        if (aiResult && aiResult.title) {
            result = {
                title: aiResult.title,
                description: aiResult.description || cleanText,
                category: aiResult.category || extractCategoryFromText(cleanText),
                location: aiResult.location || extractLocationFromText(cleanText)
            };
        } else {
            // Use fallback
            result = createFallbackExtraction(cleanText);
            console.log("🤖 Fallback result:", result);
        }

        res.json({
            success: true,
            ...result
        });
    } catch (err) {
        console.error("❌ Parse complaint error:", err);
        // Return fallback on error
        const fallback = createFallbackExtraction(req.body.text || '');
        res.json({
            success: true,
            ...fallback
        });
    }
});

// POST API: Upload Image (for AI analysis) - SECURED
// Uses memory storage and base64 encoding for reliable image analysis
app.post("/api/upload-analyze", verifyToken, uploadMemory.single("image"), async (req, res) => {
    try {
        console.log("📤 Upload request received for AI analysis");

        if (!req.file) {
            return res.status(400).json({ error: "No image file uploaded" });
        }

        console.log("📤 Image received:", req.file.originalname, req.file.size, "bytes");

        // If OpenAI API key is not available, just return a placeholder
        if (!process.env.OPENAI_API_KEY) {
            return res.json({
                success: true,
                imageUrl: null,
                description: null,
                message: "AI analysis requires OpenAI API key. Please add it to .env file."
            });
        }

        // Convert image to base64
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64Image}`;
        console.log("📤 Image converted to base64");

        // Analyze the image using base64 data
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "You are an AI assistant that analyzes civic complaint images. Look at the image and generate a detailed description of any civic issues visible (e.g., garbage, potholes, broken streetlights, water leakage, drainage problems, road damage, etc.). Focus on what the issue is and how it affects the public. Return ONLY a JSON object with 'category' (one of: Road, Garbage, Water, Streetlight, Drainage, Other) and 'description' (a concise description of the issue). Format: {\"category\": \"...\", \"description\": \"...\"}"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: dataUri,
                                    detail: "low"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0.3
            });

            const aiResponse = response.choices[0].message.content.trim();
            console.log("📤 AI Response:", aiResponse);

            // Try to parse JSON
            let result = { category: "Other", description: aiResponse };
            try {
                let cleanResponse = aiResponse;
                if (aiResponse.includes('```')) {
                    cleanResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                }
                result = JSON.parse(cleanResponse);
            } catch (parseErr) {
                console.log("⚠️ Failed to parse AI response as JSON");
                result = { category: "Other", description: aiResponse };
            }

            res.json({
                success: true,
                category: result.category || "Other",
                description: result.description || aiResponse,
                message: "Image analyzed successfully"
            });
        } catch (aiErr) {
            console.error("❌ AI analysis error:", aiErr.message);
            res.json({
                success: true,
                imageUrl: imageUrl,
                description: null,
                message: "Image uploaded but AI analysis failed."
            });
        }
    } catch (err) {
        console.error("❌ Upload API error:", err);
        res.status(500).json({ error: err.message || "Failed to upload image" });
    }
});

// --- ZONE DETECTION & AUTO-ASSIGNMENT FUNCTIONS ---

async function getZoneFromLocation(lat, lng, locationText) {
    try {
        const zones = await Zone.find({ isActive: true });

        if (!zones || zones.length === 0) {
            return null;
        }

        if (lat && lng) {
            let closestZone = null;
            let minDistance = Infinity;

            for (const zone of zones) {
                if (zone.centerLat && zone.centerLng) {
                    const distance = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
                    if (distance < minDistance && distance <= (zone.radius || 5000)) {
                        minDistance = distance;
                        closestZone = zone;
                    }
                }
            }

            if (closestZone) {
                return {
                    zone: closestZone.name,
                    zoneId: closestZone._id,
                    ward: closestZone.ward,
                    assignedStaff: closestZone.assignedStaff
                };
            }
        }

        if (locationText) {
            const lowerLocation = locationText.toLowerCase();
            for (const zone of zones) {
                if (zone.name && lowerLocation.includes(zone.name.toLowerCase())) {
                    return {
                        zone: zone.name,
                        zoneId: zone._id,
                        ward: zone.ward,
                        assignedStaff: zone.assignedStaff
                    };
                }
                if (zone.ward && lowerLocation.includes(zone.ward.toLowerCase())) {
                    return {
                        zone: zone.name,
                        zoneId: zone._id,
                        ward: zone.ward,
                        assignedStaff: zone.assignedStaff
                    };
                }
            }
        }

        return null;
    } catch (err) {
        console.error("❌ Zone detection error:", err);
        return null;
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
}

async function autoAssignZoneStaff(zoneInfo, department) {
    if (!zoneInfo || !zoneInfo.assignedStaff || zoneInfo.assignedStaff.length === 0) {
        try {
            const staffUser = await User.findOne({
                name: department,
                role: 'staff'
            });
            return staffUser ? staffUser._id : null;
        } catch (err) {
            return null;
        }
    }

    try {
        const staffUsers = await User.find({
            _id: { $in: zoneInfo.assignedStaff },
            role: 'staff'
        });

        if (staffUsers && staffUsers.length > 0) {
            const leastBusyStaff = await findLeastBusyStaff(staffUsers);
            return leastBusyStaff ? leastBusyStaff._id : null;
        }
    } catch (err) {
        console.error("❌ Error finding zone staff:", err);
    }

    return null;
}

async function findLeastBusyStaff(staffUsers) {
    try {
        let minComplaints = Infinity;
        let leastBusyStaff = null;

        for (const staff of staffUsers) {
            const pendingCount = await Complaint.countDocuments({
                assignedTo: staff._id,
                status: { $ne: 'Resolved' }
            });

            if (pendingCount < minComplaints) {
                minComplaints = pendingCount;
                leastBusyStaff = staff;
            }
        }

        return leastBusyStaff;
    } catch (err) {
        return staffUsers[0];
    }
}

// AI Smart Staff Assignment Function
async function analyzeAssignment(text) {
    if (!text) return "General Maintenance";
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `Analyze the following civic complaint and decide which department should handle it.\n\nComplaint:\n${text}\n\nDepartments:\n- Road Inspector (road damage, potholes)\n- Water Department (water leakage, drainage, sewage)\n- Electricity Board (power issues, streetlights)\n- Sanitation Department (garbage, waste, cleanliness)\n- General Maintenance (others)\n\nReturn ONLY one department name.`
                }
            ],
            max_tokens: 15,
            temperature: 0
        });
        const result = response.choices[0].message.content.trim();
        const validDepts = ["Road Inspector", "Water Department", "Electricity Board", "Sanitation Department", "General Maintenance"];

        console.log("🤖 AI Assignment Result:", result); // Debug log

        // Match the result safely against valid departments
        const matched = validDepts.find(d => result.toLowerCase().includes(d.toLowerCase()));
        if (matched) return matched;

        return "General Maintenance";
    } catch (error) {
        console.error("❌ OpenAI API Error during assignment:", error.message || error);
        return "General Maintenance"; // On API error, default safely
    }
}

// AI Categorization and Priority Function
async function analyzeComplaint(title, description) {
    const text = `Title: ${title}\nDescription: ${description}`;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are an AI assistant that analyzes civic complaints. Analyze the complaint and return JSON with two keys: 'category' (choose EXACTLY one from: Road, Garbage, Water, Electricity, Drainage, Other) and 'priority' (choose EXACTLY one from: Low, Medium, High based on urgency and severity)." },
                { role: "user", content: text }
            ],
            max_tokens: 50,
            temperature: 0
        });
        const result = JSON.parse(response.choices[0].message.content.trim());
        console.log("🤖 AI Analyze Complaint Result:", result);
        return {
            category: result.category || "Other",
            priority: result.priority || "Medium",
            aiGenerated: true
        };
    } catch (error) {
        console.error("❌ OpenAI API Error during analyzeComplaint:", error.message || error);
        return { category: "Other", priority: "Medium", aiGenerated: false };
    }
}

function calculateFinalPriority(aiPriority, upvotes) {
    if (!aiPriority) return 'Medium';
    const levels = ['Low', 'Medium', 'High'];
    let aiIndex = levels.indexOf(aiPriority);
    if (aiIndex === -1) aiIndex = 1;

    // 0-5 upvotes -> No change
    if (upvotes <= 5) {
        return aiPriority;
    }
    // 21+ upvotes -> Set to High
    else if (upvotes >= 21) {
        return 'High';
    }
    // 6-20 upvotes -> Increase by 1 level
    else {
        return levels[Math.min(aiIndex + 1, 2)];
    }
}

// POST API (CREATE complaint) - SECURED
app.post("/api/complaints", verifyToken, uploadSingleImage, async (req, res) => {
    try {
        console.log("📩 Incoming data:", req.body); // 🔥 DEBUG
        console.log("📸 Incoming file:", req.file);

        const { title, description, location, category, lat, lng } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // basic validation
        if (!title || !description || !location) {
            return res.status(400).json({ error: "Title, description, and location are required" });
        }

        // AI Spam Detection
        const spamResult = await checkSpam(title, description, location);

        if (spamResult === "SPAM") {
            console.log("🚨 Blocked Spam Complaint!");
            return res.status(400).json({ error: getT(req).spam_detected });
        }

        // Smart Staff Assignment
        const combinedTextForAssignment = `${title}\n${description}`;
        const assignedDepartment = await analyzeAssignment(combinedTextForAssignment);

        // AI Category & Priority
        const aiAnalysis = await analyzeComplaint(title, description);
        const finalCategory = aiAnalysis.category;
        const initialAiPriority = aiAnalysis.priority;
        const isAiGenerated = aiAnalysis.aiGenerated;

        let initialFinalPriority = calculateFinalPriority(initialAiPriority, 0);

        // Zone Detection & Auto-Assignment
        const parsedLat = lat ? parseFloat(lat) : null;
        const parsedLng = lng ? parseFloat(lng) : null;
        const zoneInfo = await getZoneFromLocation(parsedLat, parsedLng, location);

        let zone = null;
        let zoneId = null;
        let ward = null;
        let assignedToUser = null;

        if (zoneInfo) {
            zone = zoneInfo.zone;
            zoneId = zoneInfo.zoneId;
            ward = zoneInfo.ward;
            console.log(`📍 Detected Zone: ${zone}, Ward: ${ward}`);

            assignedToUser = await autoAssignZoneStaff(zoneInfo, assignedDepartment);
            if (assignedToUser) {
                const assignedStaff = await User.findById(assignedToUser);
                if (assignedStaff) {
                    console.log(`✅ Auto-assigned to Zone Staff: ${assignedStaff.name} (${assignedStaff._id})`);
                }
            }
        }

        if (!assignedToUser) {
            try {
                const staffUser = await User.findOne({
                    name: assignedDepartment,
                    role: 'staff'
                });
                if (staffUser) {
                    assignedToUser = staffUser._id;
                    console.log(`✅ Auto-assigned complaint to Department Staff: ${staffUser.name} (${staffUser._id})`);
                }
            } catch (dbErr) {
                console.error("❌ DB Error during staff assignment lookup:", dbErr);
            }
        }

        const prioritySource = 'AUTO';

        let slaDeadline = new Date();
        if (initialFinalPriority === 'High') {
            slaDeadline.setHours(slaDeadline.getHours() + 24);
        } else if (initialFinalPriority === 'Medium') {
            slaDeadline.setDate(slaDeadline.getDate() + 3);
        } else {
            slaDeadline.setDate(slaDeadline.getDate() + 7);
        }

        // Generate Complaint ID (NX-YYYY-XXX)
        const currentYear = new Date().getFullYear();
        const prefix = `NX-${currentYear}-`;
        const lastComplaint = await Complaint.findOne({ complaintId: { $regex: `^${prefix}` } }).sort({ createdAt: -1 });

        let nextSeq = 1;
        if (lastComplaint && lastComplaint.complaintId) {
            const parts = lastComplaint.complaintId.split('-');
            if (parts.length === 3) {
                nextSeq = parseInt(parts[2], 10) + 1;
            }
        }
        const generatedComplaintId = `${prefix}${String(nextSeq).padStart(3, '0')}`;

        const complaint = new Complaint({
            complaintId: generatedComplaintId,
            userId: req.user.id,
            title,
            description,
            location,
            category: finalCategory,
            lat: parsedLat,
            lng: parsedLng,
            imageUrl,
            priority: initialFinalPriority,
            aiPriority: initialAiPriority,
            finalPriority: initialFinalPriority,
            prioritySource,
            aiGenerated: isAiGenerated,
            slaDeadline,
            assignedDepartment,
            assignedTo: assignedToUser,
            zone: zone,
            zoneId: zoneId,
            ward: ward
        });

        await complaint.save();

        console.log("✅ Saved to DB");

        // Award points for creating a complaint
        try {
            const user = await User.findById(req.user.id);
            if (user) {
                user.points = (user.points || 0) + POINTS_CONFIG.complaint_created;
                const newBadges = calculateBadges(user.points);
                const previousBadges = user.badges || [];
                const newBadgeEarned = newBadges.find(b => !previousBadges.includes(b));
                user.badges = newBadges;
                await user.save();
                console.log(`✅ Awarded ${POINTS_CONFIG.complaint_created} points to user ${user.name} for complaint creation. Total: ${user.points}`);
            }
        } catch (pointsErr) {
            console.error("Failed to award points:", pointsErr);
        }

        // Send Email Notification
        try {
            const user = await User.findById(req.user.id);
            if (user && user.email) {
                await sendComplaintEmail(user.email, { title, description, location }, user.language || 'en');
            }
        } catch (emailErr) {
            console.error("Failed to send complaint email:", emailErr);
        }

        res.json({ message: getT(req).complaint_success });

    } catch (err) {
        console.error("❌ ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST API (CREATE complaint from CALL CENTER) - SECURED - Staff/Admin Only
app.post("/api/callcenter/complaint", verifyToken, async (req, res) => {
    try {
        // Only staff and admin can register call center complaints
        if (req.user.role !== 'staff' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Call center registration is for staff and admin only." });
        }

        const { callerName, callerPhone, title, description, category, location, priority } = req.body;

        // Validation
        if (!callerName || !callerPhone || !title || !description || !location) {
            return res.status(400).json({ error: "Caller name, phone, title, description, and location are required" });
        }

        // Smart Staff Assignment
        const combinedTextForAssignment = `${title}\n${description}`;
        const assignedDepartment = await analyzeAssignment(combinedTextForAssignment);

        // Auto-assign category if not provided
        const finalCategory = category || assignedDepartment;

        // Calculate priority
        let finalPriority = priority || 'Medium';
        if (!priority) {
            const aiAnalysis = await analyzeComplaint(title, description);
            finalPriority = aiAnalysis.priority;
        }

        // SLA Deadline
        let slaDeadline = new Date();
        if (finalPriority === 'High') {
            slaDeadline.setHours(slaDeadline.getHours() + 24);
        } else if (finalPriority === 'Medium') {
            slaDeadline.setDate(slaDeadline.getDate() + 3);
        } else {
            slaDeadline.setDate(slaDeadline.getDate() + 7);
        }

        // Generate Complaint ID (NX-YYYY-XXX)
        const currentYear = new Date().getFullYear();
        const prefix = `NX-${currentYear}-`;
        const lastComplaint = await Complaint.findOne({ complaintId: { $regex: `^${prefix}` } }).sort({ createdAt: -1 });

        let nextSeq = 1;
        if (lastComplaint && lastComplaint.complaintId) {
            const parts = lastComplaint.complaintId.split('-');
            if (parts.length === 3) {
                nextSeq = parseInt(parts[2], 10) + 1;
            }
        }
        const generatedComplaintId = `${prefix}${String(nextSeq).padStart(3, '0')}`;

        // Create complaint with call center source
        const complaint = new Complaint({
            complaintId: generatedComplaintId,
            userId: req.user.id, // Staff/admin who registered it
            title,
            description,
            location,
            category: finalCategory,
            priority: finalPriority,
            aiPriority: finalPriority,
            finalPriority: finalPriority,
            prioritySource: 'ADMIN',
            aiGenerated: false,
            slaDeadline,
            assignedDepartment,
            status: 'Pending',
            source: 'call_center',
            callerName,
            callerPhone
        });

        await complaint.save();

        console.log(`📞 Call Center complaint registered: ${generatedComplaintId} by ${req.user.name}`);

        res.status(201).json({
            success: true,
            message: "Complaint registered successfully via call center",
            complaint: complaint
        });
    } catch (err) {
        console.error("❌ Call Center Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET API (FETCH CALL CENTER complaints) - SECURED - Staff/Admin Only
app.get("/api/callcenter/complaints", verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'staff' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied" });
        }

        const complaints = await Complaint.find({ source: 'call_center' })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('assignedTo', 'name');

        res.json(complaints);
    } catch (err) {
        console.error("❌ Error fetching call center complaints:", err);
        res.status(500).json({ error: "Error fetching call center complaints" });
    }
});

console.log("GET route loaded");
// GET API (FETCH complaints) - SECURED
app.get("/api/complaints", verifyToken, async (req, res) => {
    try {
        const { status, category, priority, search, startDate, endDate, sort } = req.query;

        let query = {};
        if (req.user.role === 'admin') {
            // Admin sees all
        } else if (req.user.role === 'staff') {
            query.assignedTo = req.user.id;
        } else {
            query.userId = req.user.id;
        }

        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (startDate && endDate) {
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { complaintId: { $regex: search, $options: "i" } }
            ];
        }

        let sortObj = { createdAt: -1 }; // default: newest

        if (sort === 'upvotes' || sort === 'upvoted') {
            sortObj = { upvotesCount: -1, createdAt: -1 };
        } else if (sort === 'latest') {
            sortObj = { createdAt: -1 };
        } else if (req.user.role === 'admin' || req.user.role === 'staff') {
            // Default for privileged roles
            sortObj = { upvotesCount: -1, createdAt: -1 };
        }

        let complaints = await Complaint.find(query).sort(sortObj).populate('assignedTo', 'name');
        res.json(complaints);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching complaints" });
    }
});

// GET API: Download Complaint Receipt (PDF) - SECURED
app.get("/api/complaints/:id/receipt", verifyToken, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('userId', 'name email mobile')
            .populate('assignedTo', 'name');

        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        // Security: Only owner, admin, or assigned staff can download receipt
        const isOwner = complaint.userId && complaint.userId._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isAssignedStaff = complaint.assignedTo && complaint.assignedTo._id && complaint.assignedTo._id.toString() === req.user.id;

        if (!isOwner && !isAdmin && !isAssignedStaff) {
            return res.status(403).json({ error: "Access denied. You are not authorized to download this receipt." });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=complaint_receipt_${complaint.complaintId || complaint._id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fillColor('#4f46e5')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('NexaCivic', { align: 'center' });

        doc.moveDown(0.3);
        doc.fillColor('#1f2937')
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Complaint Receipt', { align: 'center' });

        doc.moveDown(0.5);
        doc.strokeColor('#4f46e5')
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke();

        doc.moveDown(1);

        // Helper function to add field
        const addField = (label, value, yPos) => {
            doc.fillColor('#6b7280')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(label, 50, yPos);

            doc.fillColor('#1f2937')
                .fontSize(12)
                .font('Helvetica')
                .text(value || 'N/A', 150, yPos);
        };

        let currentY = doc.y;

        addField('Tracking ID:', complaint.complaintId || 'Legacy Ticket', currentY);
        currentY += 25;
        addField('Title:', complaint.title, currentY);
        currentY += 25;
        addField('Description:', complaint.description, currentY);
        currentY += 40;
        addField('Category:', complaint.category || 'General', currentY);
        currentY += 25;

        const priorityDisplay = complaint.finalPriority || complaint.priority || 'Medium';
        addField('Priority:', priorityDisplay, currentY);
        currentY += 25;

        const statusDisplay = complaint.status || 'Pending';
        addField('Status:', statusDisplay, currentY);
        currentY += 25;

        addField('Location:', complaint.location || 'Not specified', currentY);
        currentY += 25;

        if (complaint.assignedTo && complaint.assignedTo.name) {
            addField('Assigned To:', complaint.assignedTo.name, currentY);
            currentY += 25;
        }

        addField('SLA Deadline:', complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleString() : 'Not set', currentY);
        currentY += 25;

        addField('Community Support:', `${complaint.upvotesCount || 0} upvotes`, currentY);
        currentY += 25;

        addField('Submitted On:', new Date(complaint.createdAt).toLocaleString(), currentY);
        currentY += 25;

        if (complaint.resolvedAt) {
            addField('Resolved On:', new Date(complaint.resolvedAt).toLocaleString(), currentY);
            currentY += 25;
        }

        // Reporter info section
        doc.moveDown(1);
        currentY = doc.y;

        doc.fillColor('#4f46e5')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text('Reporter Information', 50, currentY);

        currentY += 20;

        if (complaint.userId) {
            addField('Name:', complaint.userId.name || 'Anonymous', currentY);
            currentY += 25;
            addField('Email:', complaint.userId.email || 'Not provided', currentY);
            currentY += 25;
            if (complaint.userId.mobile) {
                addField('Mobile:', complaint.userId.mobile, currentY);
                currentY += 25;
            }
        } else {
            doc.fillColor('#1f2937')
                .fontSize(12)
                .text('Anonymous Submission', 150, currentY);
        }

        // Footer
        doc.moveDown(2);
        doc.strokeColor('#e5e7eb')
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .stroke();

        doc.moveDown(0.5);
        doc.fillColor('#9ca3af')
            .fontSize(9)
            .font('Helvetica')
            .text('This is a system-generated receipt from NexaCivic Civic Issue Reporting System.', { align: 'center' });

        doc.moveDown(0.3);
        doc.text('Please keep this receipt for your records. You can track your complaint status online.', { align: 'center' });

        doc.moveDown(0.3);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

        doc.moveDown(0.5);
        doc.fillColor('#4f46e5')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('NexaCivic - Making Cities Better, Together', { align: 'center' });

        doc.end();
    } catch (err) {
        console.error("❌ Error generating receipt:", err);
        res.status(500).json({ error: "Failed to generate receipt" });
    }
});

// GET API (FETCH PUBLIC COMPLAINTS FOR UPVOTING) - SECURED
app.get("/api/complaints/public", verifyToken, async (req, res) => {
    try {
        const { status, category, priority, search, sort } = req.query;

        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { complaintId: { $regex: search, $options: "i" } }
            ];
        }

        let sortObj = { createdAt: -1 }; // default: newest
        if (sort === "upvoted") sortObj = { upvotesCount: -1, createdAt: -1 };

        let complaints = await Complaint.find(query).sort(sortObj).populate('assignedTo', 'name');
        res.json(complaints);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching public complaints" });
    }
});

// GET API (HEATMAP)
app.get("/api/complaints/heatmap", verifyToken, async (req, res) => {
    try {
        const { category, priority, days } = req.query;

        let query = { lat: { $exists: true, $ne: null }, lng: { $exists: true, $ne: null } };

        if (category && category !== 'All') query.category = category;
        if (priority && priority !== 'All') query.priority = priority;

        if (days && days !== 'All') {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - parseInt(days));
            query.createdAt = { $gte: dateLimit };
        }

        const complaints = await Complaint.find(query).select('lat lng priority');

        const heatmapData = complaints.map(c => {
            const intensity = c.priority === 'High' ? 2 : c.priority === 'Medium' ? 1.5 : 1;
            return {
                lat: c.lat,
                lng: c.lng,
                intensity: intensity
            };
        });

        res.json(heatmapData);
    } catch (err) {
        console.error("❌ Heatmap Error:", err);
        res.status(500).json({ error: "Error fetching heatmap data" });
    }
});

// GET API (FETCH staff accounts) - ADMIN ONLY
app.get("/api/staff", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const staffList = await User.find({ role: 'staff' }).select('name email');
        res.json(staffList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching staff" });
    }
});

// GET API: Department Performance Scores - ADMIN ONLY
app.get("/api/departments/scores", verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Aggregate complaint data by department
        const stats = await Complaint.aggregate([
            {
                $group: {
                    _id: { $ifNull: ["$department", "$assignedDepartment"] },
                    totalIssues: { $sum: 1 },
                    resolvedCount: {
                        $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] }
                    },
                    escalatedCount: {
                        $sum: { $cond: [{ $eq: ["$escalated", true] }, 1, 0] }
                    },
                    // We need the raw docs to calculate average resolution time
                    // because we need to subtract dates which is easier in JS or via more complex aggregation
                    resolvedComplaints: {
                        $push: {
                            $cond: [
                                { $eq: ["$status", "Resolved"] },
                                {
                                    createdAt: "$createdAt",
                                    resolvedAt: "$resolvedAt",
                                    updatedAt: "$updatedAt"
                                },
                                "$$REMOVE"
                            ]
                        }
                    }
                }
            }
        ]);

        const results = stats.map(dept => {
            const resolvedDocs = dept.resolvedComplaints || [];
            let totalTimeMs = 0;

            resolvedDocs.forEach(doc => {
                const endTime = doc.resolvedAt || doc.updatedAt;
                const startTime = doc.createdAt;
                if (endTime && startTime) {
                    totalTimeMs += (new Date(endTime) - new Date(startTime));
                }
            });

            // Convert to Days for the score calculation (2.5 days format)
            const avgTimeDays = resolvedDocs.length > 0
                ? (totalTimeMs / resolvedDocs.length) / (1000 * 60 * 60 * 24)
                : 0;

            // SCORE FORMULA (MANDATORY):
            // score = (resolvedCount * 2) - (avgTime * 0.5) - (escalatedCount * 1)
            const score = (dept.resolvedCount * 2) - (avgTimeDays * 0.5) - (dept.escalatedCount * 1);

            return {
                department: dept._id || "General Maintenance",
                score: Math.round(score * 100) / 100,
                resolved: dept.resolvedCount,
                escalated: dept.escalatedCount,
                avgTime: Math.round(avgTimeDays * 10) / 10, // 1 decimal place
                totalIssues: dept.totalIssues
            };
        });

        // Sort by score DESC
        results.sort((a, b) => b.score - a.score);

        // Add Rank
        results.forEach((item, index) => {
            item.rank = index + 1;
        });

        res.json(results);
    } catch (err) {
        console.error("❌ Stats Error:", err);
        res.status(500).json({ error: "Error calculating department scores" });
    }
});

// PUT API (ASSIGN complaint) - ADMIN ONLY
app.put("/api/complaints/:id/assign", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { assignedTo: assignedTo || null },
            { new: true }
        ).populate('assignedTo', 'name');

        if (!complaint) return res.status(404).json({ error: "Complaint not found" });
        res.json(complaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error assigning complaint" });
    }
});

// PUT API (UPDATE complaint status) - ASSIGNED STAFF ONLY
app.put("/api/complaints/:id/status", verifyToken, async (req, res) => {
    try {
        const { status } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        // Security check
        if (req.user.role !== 'staff' || !complaint.assignedTo || complaint.assignedTo.toString() !== String(req.user.id)) {
            return res.status(403).json({ error: "Access Denied. Only assigned staff can change the status." });
        }

        complaint.status = status;
        if (status === 'Resolved' && !complaint.resolvedAt) {
            complaint.resolvedAt = new Date();
            // check SLA
            if (complaint.resolvedAt > complaint.slaDeadline) {
                complaint.slaStatus = 'Delayed';
            } else {
                complaint.slaStatus = 'On Time';
            }
        } else if (status !== 'Resolved') {
            // Clear resolution data if moving back to pending/in progress
            complaint.resolvedAt = undefined;
            complaint.slaStatus = undefined;
        }
        await complaint.save();

        // If resolved, award points to the user who created the complaint
        if (status === 'Resolved') {
            try {
                const complaintOwner = await User.findById(complaint.userId);
                if (complaintOwner) {
                    const previousPoints = complaintOwner.points || 0;
                    complaintOwner.points = previousPoints + POINTS_CONFIG.complaint_resolved;
                    const newBadges = calculateBadges(complaintOwner.points);
                    const previousBadges = complaintOwner.badges || [];
                    const newBadgeEarned = newBadges.find(b => !previousBadges.includes(b));
                    complaintOwner.badges = newBadges;
                    await complaintOwner.save();
                    console.log(`✅ Awarded ${POINTS_CONFIG.complaint_resolved} points to complaint owner ${complaintOwner.name}. Total: ${complaintOwner.points}`);
                }
            } catch (pointsErr) {
                console.error("Failed to award points for resolution:", pointsErr);
            }
        }

        // If resolved, notify the user
        if (status === 'Resolved') {
            try {
                const user = await User.findById(complaint.userId);
                if (user && user.email) {
                    await sendStatusUpdateEmail(user.email, complaint, user.language || 'en');
                }
            } catch (emailErr) {
                console.error("Failed to send resolution email:", emailErr);
            }
        }

        // populate after save
        const populatedComplaint = await Complaint.findById(complaint._id).populate('assignedTo', 'name');
        res.json(populatedComplaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating status" });
    }
});

// DELETE API (DELETE complaint) - ADMIN OR ASSIGNED STAFF
app.delete("/api/complaints/:id", verifyToken, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        // Security check
        if (req.user.role !== 'admin') {
            if (req.user.role !== 'staff' || !complaint.assignedTo || complaint.assignedTo.toString() !== String(req.user.id)) {
                return res.status(403).json({ error: "Access Denied. Not authorized to delete." });
            }
        }

        await Complaint.findByIdAndDelete(req.params.id);
        res.json({ message: "Complaint deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error deleting complaint" });
    }
});

// PUT API (UPDATE complaint priority) - ASSIGNED STAFF ONLY
app.put("/api/complaints/:id/priority", verifyToken, async (req, res) => {
    try {
        const { priority } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        // Security check
        if (req.user.role !== 'staff' || !complaint.assignedTo || complaint.assignedTo.toString() !== String(req.user.id)) {
            return res.status(403).json({ error: "Access Denied. Only assigned staff can change the priority." });
        }

        complaint.priority = priority;
        complaint.prioritySource = 'ADMIN';

        // Recalculate SLA based on createdAt
        let slaDeadline = new Date(complaint.createdAt || Date.now());
        if (priority === 'High') slaDeadline.setHours(slaDeadline.getHours() + 24);
        else if (priority === 'Medium') slaDeadline.setDate(slaDeadline.getDate() + 3);
        else slaDeadline.setDate(slaDeadline.getDate() + 7);

        complaint.slaDeadline = slaDeadline;

        await complaint.save();
        const populatedComplaint = await Complaint.findById(complaint._id).populate('assignedTo', 'name');
        res.json(populatedComplaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating priority" });
    }
});

// POST API (UPVOTE complaint)
app.post("/api/complaints/:id/upvote", verifyToken, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        const userId = req.user.id;
        const upvotesList = complaint.upvotes || [];
        const hasUpvoted = upvotesList.some(id => id.toString() === userId.toString());

        if (hasUpvoted) {
            // Remove upvote
            complaint.upvotes = upvotesList.filter(id => id.toString() !== userId.toString());
            complaint.upvotesCount = Math.max((complaint.upvotesCount || 1) - 1, 0);
        } else {
            // Add upvote
            complaint.upvotes.push(userId);
            complaint.upvotesCount = (complaint.upvotesCount || 0) + 1;
        }

        // Auto-recalculate priority if source is AUTO
        if (complaint.prioritySource !== 'ADMIN') {
            const aiP = complaint.aiPriority || complaint.priority || 'Medium';
            const newFinalPriority = calculateFinalPriority(aiP, complaint.upvotesCount);

            if (newFinalPriority !== complaint.finalPriority || newFinalPriority !== complaint.priority) {
                complaint.finalPriority = newFinalPriority;
                complaint.priority = newFinalPriority; // Keep legacy field in sync
                // recalculate SLA
                let slaDeadline = new Date(complaint.createdAt || Date.now());
                if (newFinalPriority === 'High') slaDeadline.setHours(slaDeadline.getHours() + 24);
                else if (newFinalPriority === 'Medium') slaDeadline.setDate(slaDeadline.getDate() + 3);
                else slaDeadline.setDate(slaDeadline.getDate() + 7);
                complaint.slaDeadline = slaDeadline;
            }
        }

        await complaint.save();
        const populatedComplaint = await Complaint.findById(complaint._id).populate('assignedTo', 'name');
        res.json(populatedComplaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error updating upvote" });
    }
});

// POST API (SUBMIT FEEDBACK) - USER ONLY
app.post("/api/complaints/:id/feedback", verifyToken, async (req, res) => {
    try {
        console.log("📝 Feedback submission request received");
        console.log("📝 User ID from token:", req.user.id);
        console.log("📝 Complaint ID:", req.params.id);

        const { rating, feedback } = req.body;
        console.log("📝 Rating:", rating, "Feedback:", feedback);

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            console.log("❌ Complaint not found");
            return res.status(404).json({ error: "Complaint not found" });
        }

        console.log("📝 Complaint status:", complaint.status);
        console.log("📝 Complaint userId:", complaint.userId);
        console.log("📝 Feedback already given:", complaint.feedbackGiven);

        // Validation Rules
        if (complaint.status !== 'Resolved') {
            console.log("❌ Complaint not resolved yet");
            return res.status(400).json({ error: "Feedback can only be submitted for resolved complaints." });
        }

        // Allow feedback if userId is null (legacy complaints) or matches the user
        const isOwner = !complaint.userId || complaint.userId.toString() === String(req.user.id);
        if (!isOwner) {
            console.log("❌ User does not own this complaint");
            return res.status(403).json({ error: "Access Denied. You do not own this complaint." });
        }

        if (complaint.feedbackGiven) {
            console.log("❌ Feedback already submitted");
            return res.status(400).json({ error: "Feedback has already been submitted for this ticket." });
        }

        if (!rating || rating < 1 || rating > 5) {
            console.log("❌ Invalid rating:", rating);
            return res.status(400).json({ error: "Rating must be a valid number between 1 and 5." });
        }

        complaint.rating = rating;
        complaint.feedback = feedback || '';
        complaint.feedbackGiven = true;
        complaint.feedbackSubmittedAt = new Date();

        await complaint.save();
        console.log("✅ Feedback saved successfully");

        // Award points for feedback
        try {
            const user = await User.findById(req.user.id);
            if (user) {
                user.points = (user.points || 0) + POINTS_CONFIG.feedback_given;
                const newBadges = calculateBadges(user.points);
                const previousBadges = user.badges || [];
                user.badges = newBadges;
                await user.save();
                console.log(`✅ Awarded ${POINTS_CONFIG.feedback_given} points to user. Total: ${user.points}`);
            }
        } catch (pointsErr) {
            console.error("Failed to award points for feedback:", pointsErr);
        }

        const populatedComplaint = await Complaint.findById(complaint._id).populate('assignedTo', 'name');
        res.json({
            success: true,
            message: "Feedback submitted successfully",
            complaint: populatedComplaint
        });
    } catch (err) {
        console.error("❌ Error submitting feedback:", err);
        res.status(500).json({ error: "Error submitting feedback" });
    }
});

// GET API (FETCH MESSAGES)
app.get("/api/messages/:complaintId", verifyToken, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.complaintId);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        // RBAC Verification
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: "Admins cannot access messages." });
        }
        if (req.user.role === 'user' && (!complaint.userId || complaint.userId.toString() !== String(req.user.id))) {
            return res.status(403).json({ error: "Access Denied." });
        }
        if (req.user.role === 'staff' && (!complaint.assignedTo || complaint.assignedTo.toString() !== String(req.user.id))) {
            return res.status(403).json({ error: "Access Denied." });
        }

        const messages = await Message.find({ complaintId: req.params.complaintId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// POST API (SEND MESSAGE)
app.post("/api/messages", verifyToken, async (req, res) => {
    try {
        const { complaintId, message } = req.body;
        if (!message) return res.status(400).json({ error: "Message cannot be empty" });

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        // RBAC Verification
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: "Admins cannot send messages." });
        }
        if (req.user.role === 'user' && (!complaint.userId || complaint.userId.toString() !== String(req.user.id))) {
            return res.status(403).json({ error: "Access Denied. You do not own this complaint." });
        }
        if (req.user.role === 'staff' && (!complaint.assignedTo || complaint.assignedTo.toString() !== String(req.user.id))) {
            return res.status(403).json({ error: "Access Denied. You are not assigned to this complaint." });
        }

        const userObj = await User.findById(req.user.id);

        const newMessage = new Message({
            complaintId,
            senderId: req.user.id,
            senderName: userObj.name,
            senderRole: req.user.role,
            message
        });
        await newMessage.save();

        res.json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// PUT API (REACT TO MESSAGE)
app.put("/api/messages/:id/react", verifyToken, async (req, res) => {
    try {
        const { reaction } = req.body;
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ error: "Message not found" });

        const complaint = await Complaint.findById(message.complaintId);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        // RBAC Verification
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: "Admins cannot react to messages." });
        }
        if (req.user.role === 'user' && (!complaint.userId || complaint.userId.toString() !== String(req.user.id))) {
            return res.status(403).json({ error: "Access Denied." });
        }
        if (req.user.role === 'staff' && (!complaint.assignedTo || complaint.assignedTo.toString() !== String(req.user.id))) {
            return res.status(403).json({ error: "Access Denied." });
        }

        // Toggle logic: if clicking the same reaction, remove it. Otherwise replace it.
        if (message.reaction === reaction) {
            message.reaction = null;
        } else {
            message.reaction = reaction;
        }

        await message.save();
        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- USER PROFILE MANAGEMENT ---

// GET API: Fetch logged-in user profile
app.get("/api/user/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -__v");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// POST API: Send OTP for Email Update
app.post("/api/user/send-email-update-otp", verifyToken, async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) return res.status(400).json({ error: "New email is required" });

        // Check if email already in use
        const existing = await User.findOne({ email: newEmail });
        if (existing) return res.status(400).json({ error: "Email is already in use" });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

        // Store in otpStore (use userId to prevent collision)
        otpStore[req.user.id] = {
            otp,
            newEmail,
            expiresAt
        };

        // Send OTP Email
        await sendOTPEmail(newEmail, otp);

        res.json({ message: "Verification OTP sent to your new email." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// POST API: Verify and Update Email
app.post("/api/user/verify-email-update", verifyToken, async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ error: "OTP is required" });

        const entry = otpStore[req.user.id];
        if (!entry) return res.status(400).json({ error: "No pending email change found." });

        if (Date.now() > entry.expiresAt) {
            delete otpStore[req.user.id];
            return res.status(400).json({ error: "OTP expired." });
        }

        if (entry.otp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // OTP is correct! Update email
        const user = await User.findById(req.user.id);
        user.email = entry.newEmail;
        await user.save();

        delete otpStore[req.user.id];

        res.json({ message: "Email updated successfully!", email: user.email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});

// PUT API: Update Profile (Name, Mobile, Password)
app.put("/api/user/update", verifyToken, async (req, res) => {
    try {
        const { name, mobile, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (name) user.name = name;
        if (mobile) {
            // Check if mobile already in use by someone else
            const existingMobile = await User.findOne({ mobile, _id: { $ne: user._id } });
            if (existingMobile) return res.status(400).json({ error: "Mobile number already in use" });
            user.mobile = mobile;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        await user.save();
        res.json({
            message: "Profile updated successfully!",
            user: {
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                id: user._id,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error during profile update" });
    }
});

// AI Chatbot Assistant API
app.post("/api/chatbot", async (req, res) => {
    try {
        console.log("🤖 Chatbot Request received");
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        // Try to get user info if authenticated, but don't fail if not
        let user = null;
        let language = 'en';
        const authHeader = req.header("Authorization");
        if (authHeader) {
            try {
                const token = authHeader.split(" ")[1];
                const jwt = require("jsonwebtoken");
                const verified = jwt.verify(token, "nexacivic_super_secret_key");
                user = await User.findById(verified.id);
                if (user) {
                    console.log("🤖 Chatbot Request from user:", user.id);
                    language = user.language || 'en';
                }
            } catch (err) {
                console.log("⚠️ Could not authenticate token for chatbot, proceeding as guest");
            }
        }

        // Prepare context for OpenAI
        const userName = user?.name || 'Guest';
        const systemPrompt = `You are NexaCivic Assistant, a helpful AI for a civic complaint system.
        The current user's name is ${userName}.
        The current user's preferred language is ${language}. Please respond in this language if possible.
        Help users to:
        1. Submit complaints: Explain they can use the "Submit Complaint" form.
        2. Track complaint status: Mention they can see their complaints in the "My Complaints" list. Note that pending complaints are awaiting admin review, in progress means staff is assigned, and resolved means fixed!
        3. Understand priority and SLA: 
           - High Priority: 24 hours (Critical issues like major water leaks or dangerous road damage)
           - Medium Priority: 3 days (Standard issues)
           - Low Priority: 7 days (Non-urgent maintenance)
        4. Navigate dashboard features: Explain the analytics stats, the heatmap hotspots, and the community board for upvoting.
        5. Answer in simple and clear language.
        Keep answers short, helpful, and concise. Don't use markdown headers if possible, just plain text with emojis.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || []).map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: message }
        ];

        console.log("🧠 Sending to OpenAI...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 400,
            temperature: 0.7,
        });

        const reply = response.choices[0].message.content;
        console.log("✅ AI Reply Generated");
        res.json({ reply });

    } catch (err) {
        console.error("❌ Chatbot Error Details:", err);

        // Check if it's an authentication issue (invalid API key, etc.)
        const isAuthError =
            err.status === 401 ||
            err.status === 403 ||
            err.code === 'invalid_api_key' ||
            (err.error && err.error.code === 'invalid_api_key');

        // Check for quota or rate limit errors
        const isQuotaExceeded =
            err.status === 429 ||
            err.code === 'insufficient_quota' ||
            err.type === 'insufficient_quota' ||
            (err.error && (err.error.code === 'insufficient_quota' || err.error.type === 'insufficient_quota'));

        // Use fallback for ANY OpenAI error
        if (isAuthError) {
            console.warn("⚠️ OpenAI Authentication Error. Using rule-based fallback assistant.");
        } else if (isQuotaExceeded) {
            console.warn("⚠️ OpenAI Quota Exceeded (429). Using rule-based fallback assistant.");
        } else {
            console.warn("⚠️ OpenAI API Error. Using rule-based fallback assistant.");
        }

        const lowerMsg = (req.body?.message || "").toLowerCase();
        let fallbackReply = "I'm sorry, my advanced AI logic is currently undergoing maintenance 🛠️. However, I can still help you with basic tasks!";

        if (lowerMsg.includes("complaint") || lowerMsg.includes("report") || lowerMsg.includes("submit")) {
            fallbackReply = "To report a problem, go to your Dashboard and fill out the 'Submit a New Complaint' form. Don't forget to add a photo and pin the location! 📍";
        } else if (lowerMsg.includes("status") || lowerMsg.includes("track") || lowerMsg.includes("my")) {
            fallbackReply = "You can track your complaints in the 'My Complaints' section on your Dashboard. 'Pending' means we've received it, 'In Progress' means we're working on it! 📈";
        } else if (lowerMsg.includes("priority") || lowerMsg.includes("sla") || lowerMsg.includes("time") || lowerMsg.includes("level")) {
            fallbackReply = "Our SLAs are: High Priority (24h), Medium Priority (3 days), and Low Priority (7 days).⏱️";
        } else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey")) {
            fallbackReply = "Hello! I am the NexaCivic Assistant. How can I help you improve our city today? 🏙️";
        } else if (lowerMsg.includes("thank") || lowerMsg.includes("bye")) {
            fallbackReply = "You're welcome! Let me know if you need anything else. Have a great day! 😊";
        }

        return res.json({ reply: fallbackReply });
    }
});

// Help Assistant Chatbot (for Homepage Help)
app.post("/api/help-chatbot", async (req, res) => {
    try {
        const { message, language } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const lang = language || 'en';

        const systemPrompt = `You are NexaCivic Help Assistant.
        You ONLY help users understand how to use this website.
        You can answer:
        - How to register: Click 'Register' on the top nav, enter details, and verify with Email Verification OTP.
        - How to submit complaint: Go to the Dashboard after login and fill the "Submit New Complaint" form. You can use voice too!
        - How to track complaint: Visit "My Complaints" in your dashboard.
        - What is priority: It's the level of urgency (High/Medium/Low) based on severity.
        - What is SLA: High (24h), Medium (3 days), Low (7 days).
        - How to use dashboard: View your activity stats, heatmap hotspots, and local upvote hub.

        STRICT RULE: DO NOT answer any general knowledge, personal, or non-NexaCivic questions.
        If the user asks an unrelated question, you MUST reply with ONLY: 'I can help only with NexaCivic usage.'
        
        Always respond in the following language: ${lang}.
        Keep answers very simple and step-by-step.`;

        console.log(`🤖 Help Chatbot Request [${lang}]:`, message);

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ],
                max_tokens: 300,
                temperature: 0.3,
            });

            const reply = response.choices[0].message.content;
            console.log("✅ Help Chatbot Reply Generated");
            res.json({ reply });
        } catch (err) {
            console.error("OpenAI Help Chat Error:", err);

            // --- Rule-based Fallback for Help Assistant ---
            const lowerMsg = (message || "").toLowerCase();
            let fallback = "I'm sorry, I'm having trouble connecting to my AI logic 🧠. But I can still tell you: You can Submit Complaints and Track them on your Dashboard after Login! 🏗️";

            if (lowerMsg.includes("register") || lowerMsg.includes("account") || lowerMsg.includes("signup")) {
                fallback = "To register: Click 'Register' on the top nav, enter your name, email, mobile, and password. You'll need to verify with a 6-digit OTP sent to your email! 📧";
            } else if (lowerMsg.includes("submit") || lowerMsg.includes("report") || lowerMsg.includes("file")) {
                fallback = "To submit a complaint: Log In, go to your Dashboard, and fill the 'Submit a New Complaint' form. You can also use the microphone icon to speak your complaint! 🎤";
            } else if (lowerMsg.includes("track") || lowerMsg.includes("status") || lowerMsg.includes("my")) {
                fallback = "To track complaints: Visit the 'My Complaints' section on your Dashboard to see live status updates. 📈";
            } else if (lowerMsg.includes("priority") || lowerMsg.includes("sla") || lowerMsg.includes("time") || lowerMsg.includes("level")) {
                fallback = "NexaCivic SLAs: High Priority (24 hours), Medium Priority (3 days), Low Priority (7 days). ⏱️";
            } else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey")) {
                fallback = "Hello! I am the Help Assistant. I can tell you how to use this website! 🤖";
            }

            // Language specific basic translations for fallback
            if (lang === 'hi') fallback = "क्षमा करें, मैं कनेक्ट नहीं हो पा रहा हूँ। आप डैशबोर्ड पर जाकर शिकायतें दर्ज कर सकते हैं! 🏗️";
            if (lang === 'ta') fallback = "மன்னிக்கவும், என்னால் இப்போது பதிலளிக்க முடியவில்லை. உங்கள் டாஷ்போர்டில் புகாரைப் பதிவு செய்ய முடியும்! 🏗️";

            res.json({ reply: fallback });
        }

    } catch (err) {
        console.error("❌ Help Chatbot Fatal Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// --- MULTI-LEVEL ESCALATION ENGINE ---

const ESCALATION_LEVELS = {
    1: { name: 'Staff', threshold: 24 },       // 24 hours pending
    2: { name: 'Supervisor', threshold: 12 },  // Additional 12 hours at level 1
    3: { name: 'Admin', threshold: 6 },        // Additional 6 hours at level 2
    4: { name: 'Higher Authority', threshold: 0 } // Maximum escalation
};

function getEscalationName(level) {
    const names = {
        1: 'Staff',
        2: 'Supervisor',
        3: 'Admin',
        4: 'Higher Authority'
    };
    return names[level] || 'Staff';
}

function getPendingTimeHours(complaint) {
    const now = new Date();
    const lastUpdate = complaint.escalationHistory && complaint.escalationHistory.length > 0
        ? new Date(complaint.escalationHistory[complaint.escalationHistory.length - 1].date)
        : new Date(complaint.createdAt);
    return (now - lastUpdate) / (1000 * 60 * 60);
}

function shouldAutoEscalate(complaint) {
    if (complaint.status === 'Resolved') return { should: false, reason: 'Already resolved' };
    if (complaint.escalationLevel >= 4) return { should: false, reason: 'Maximum escalation level reached' };

    const currentLevel = complaint.escalationLevel || 1;
    const threshold = ESCALATION_LEVELS[currentLevel]?.threshold || 24;
    const pendingHours = getPendingTimeHours(complaint);

    if (complaint.priority === 'High' && pendingHours >= threshold / 2) {
        return { should: true, reason: 'High priority - accelerated escalation' };
    }

    if (pendingHours >= threshold) {
        return { should: true, reason: `Pending for ${Math.round(pendingHours)} hours (threshold: ${threshold}h)` };
    }

    return { should: false, reason: 'Within SLA' };
}

async function performEscalation(complaint, reason, escalatedBy = null) {
    const currentLevel = complaint.escalationLevel || 1;
    const newLevel = Math.min(currentLevel + 1, 4);

    complaint.escalationLevel = newLevel;
    complaint.escalated = true;
    complaint.escalatedAt = new Date();

    complaint.escalationHistory.push({
        level: newLevel,
        escalatedTo: getEscalationName(newLevel),
        reason: reason,
        escalatedBy: escalatedBy,
        date: new Date()
    });

    await complaint.save();

    console.log(`📡 Escalated ${complaint.complaintId} to Level ${newLevel} (${getEscalationName(newLevel)})`);

    return complaint;
}

// POST /api/escalate/:complaintId - Manual escalation (Admin only)
app.post("/api/escalate/:complaintId", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { reason } = req.body;

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }

        if (complaint.status === 'Resolved') {
            return res.status(400).json({ error: "Cannot escalate resolved complaint" });
        }

        if (complaint.escalationLevel >= 4) {
            return res.status(400).json({ error: "Complaint already at maximum escalation level" });
        }

        const escalatedComplaint = await performEscalation(
            complaint,
            reason || 'Manual escalation by admin',
            req.user.id
        );

        res.json({
            message: `Complaint escalated to Level ${escalatedComplaint.escalationLevel}`,
            escalationLevel: escalatedComplaint.escalationLevel,
            escalatedTo: getEscalationName(escalatedComplaint.escalationLevel),
            history: escalatedComplaint.escalationHistory
        });
    } catch (err) {
        console.error("❌ Manual Escalation Error:", err);
        res.status(500).json({ error: "Escalation failed" });
    }
});

// API to run escalation manually (Admin Only)
app.post("/api/escalate/run", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: { $ne: 'Resolved' } });
        let escalatedCount = 0;
        const results = [];

        for (const complaint of complaints) {
            const escalationCheck = shouldAutoEscalate(complaint);
            if (escalationCheck.should) {
                await performEscalation(complaint, escalationCheck.reason, req.user.id);
                escalatedCount++;
                results.push({
                    complaintId: complaint.complaintId,
                    newLevel: complaint.escalationLevel,
                    reason: escalationCheck.reason
                });
            }
        }

        res.json({
            message: `Escalation engine finished. ${escalatedCount} complaints escalated.`,
            escalatedCount,
            results
        });
    } catch (err) {
        console.error("❌ Escalation Engine Error:", err);
        res.status(500).json({ error: "Escalation Engine failed" });
    }
});

// Auto-run every 15 minutes
setInterval(async () => {
    console.log("⚙️ Running Auto Escalation Engine (Multi-Level)...");
    try {
        const complaints = await Complaint.find({ status: { $ne: 'Resolved' } });
        let escalatedCount = 0;

        for (const complaint of complaints) {
            const escalationCheck = shouldAutoEscalate(complaint);
            if (escalationCheck.should) {
                await performEscalation(complaint, escalationCheck.reason);
                escalatedCount++;
            }
        }

        if (escalatedCount > 0) {
            console.log(`✅ Auto Escalation: ${escalatedCount} complaints escalated`);
        }
    } catch (err) {
        console.error("❌ Auto Escalation Error:", err);
    }
}, 15 * 60 * 1000); // 15 minutes

// --- ZONE MANAGEMENT APIs ---

app.get("/api/zones", verifyToken, async (req, res) => {
    try {
        const zones = await Zone.find({ isActive: true })
            .populate('assignedStaff', 'name email mobile')
            .sort({ name: 1 });

        const zonesWithStats = await Promise.all(zones.map(async (zone) => {
            const stats = await Complaint.aggregate([
                { $match: { zoneId: zone._id } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } }
                    }
                }
            ]);

            return {
                ...zone.toObject(),
                stats: stats[0] || { total: 0, resolved: 0, pending: 0 }
            };
        }));

        res.json(zonesWithStats);
    } catch (err) {
        console.error("❌ Get Zones Error:", err);
        res.status(500).json({ error: "Failed to fetch zones" });
    }
});

app.post("/api/zones", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { name, ward, description, centerLat, centerLng, radius, assignedStaff, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Zone name is required" });
        }

        const existingZone = await Zone.findOne({ name });
        if (existingZone) {
            return res.status(400).json({ error: "Zone with this name already exists" });
        }

        const zone = new Zone({
            name,
            ward: ward || null,
            description: description || null,
            centerLat: centerLat || null,
            centerLng: centerLng || null,
            radius: radius || 5000,
            assignedStaff: assignedStaff || [],
            color: color || '#4f46e5'
        });

        await zone.save();
        await zone.populate('assignedStaff', 'name email mobile');

        res.json({ message: "Zone created successfully", zone });
    } catch (err) {
        console.error("❌ Create Zone Error:", err);
        res.status(500).json({ error: "Failed to create zone" });
    }
});

app.put("/api/zones/:zoneId", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { zoneId } = req.params;
        const { name, ward, description, centerLat, centerLng, radius, assignedStaff, color, isActive } = req.body;

        const zone = await Zone.findById(zoneId);
        if (!zone) {
            return res.status(404).json({ error: "Zone not found" });
        }

        if (name && name !== zone.name) {
            const existingZone = await Zone.findOne({ name, _id: { $ne: zoneId } });
            if (existingZone) {
                return res.status(400).json({ error: "Zone with this name already exists" });
            }
        }

        zone.name = name || zone.name;
        zone.ward = ward !== undefined ? ward : zone.ward;
        zone.description = description !== undefined ? description : zone.description;
        zone.centerLat = centerLat !== undefined ? centerLat : zone.centerLat;
        zone.centerLng = centerLng !== undefined ? centerLng : zone.centerLng;
        zone.radius = radius !== undefined ? radius : zone.radius;
        zone.assignedStaff = assignedStaff !== undefined ? assignedStaff : zone.assignedStaff;
        zone.color = color || zone.color;
        zone.isActive = isActive !== undefined ? isActive : zone.isActive;

        await zone.save();
        await zone.populate('assignedStaff', 'name email mobile');

        res.json({ message: "Zone updated successfully", zone });
    } catch (err) {
        console.error("❌ Update Zone Error:", err);
        res.status(500).json({ error: "Failed to update zone" });
    }
});

app.delete("/api/zones/:zoneId", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { zoneId } = req.params;

        const zone = await Zone.findById(zoneId);
        if (!zone) {
            return res.status(404).json({ error: "Zone not found" });
        }

        const complaintCount = await Complaint.countDocuments({ zoneId });
        if (complaintCount > 0) {
            zone.isActive = false;
            await zone.save();
            return res.json({ message: "Zone deactivated (has existing complaints)", zone });
        }

        await Zone.findByIdAndDelete(zoneId);
        res.json({ message: "Zone deleted successfully" });
    } catch (err) {
        console.error("❌ Delete Zone Error:", err);
        res.status(500).json({ error: "Failed to delete zone" });
    }
});

app.get("/api/zones/stats", verifyToken, async (req, res) => {
    try {
        const allZones = await Zone.find({ isActive: true });

        const zoneStats = await Promise.all(allZones.map(async (zone) => {
            const complaints = await Complaint.find({ zoneId: zone._id });

            return {
                _id: zone._id,
                name: zone.name,
                ward: zone.ward,
                color: zone.color,
                total: complaints.length,
                pending: complaints.filter(c => c.status === 'Pending').length,
                inProgress: complaints.filter(c => c.status === 'In Progress').length,
                resolved: complaints.filter(c => c.status === 'Resolved').length,
                highPriority: complaints.filter(c => c.priority === 'High').length,
                escalated: complaints.filter(c => c.escalated).length
            };
        }));

        res.json(zoneStats);
    } catch (err) {
        console.error("❌ Zone Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch zone statistics" });
    }
});

app.get("/api/wards", verifyToken, async (req, res) => {
    try {
        const wards = await Zone.distinct('ward', { isActive: true, ward: { $ne: null } });
        res.json(wards.filter(w => w));
    } catch (err) {
        console.error("❌ Get Wards Error:", err);
        res.status(500).json({ error: "Failed to fetch wards" });
    }
});

// start server
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});