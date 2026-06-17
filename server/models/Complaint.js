const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
    complaintId: {
        type: String,
        unique: true,
        sparse: true // Allows existing legacy tickets to coexist without breaking the unique index constraint
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // We do not make it required yet so it won't crash your existing old complaints without a userId
    },
    title: String,
    description: String,
    location: String,
    category: String,
    lat: Number,
    lng: Number,
    imageUrl: String,
    status: {
        type: String,
        default: "Pending",
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    assignedDepartment: {
        type: String,
        default: "General Maintenance"
    },
    department: {
        type: String,
        default: "General Maintenance"
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    aiPriority: {
        type: String,
        enum: ['Low', 'Medium', 'High']
    },
    finalPriority: {
        type: String,
        enum: ['Low', 'Medium', 'High']
    },
    prioritySource: {
        type: String,
        enum: ['AUTO', 'ADMIN'],
        default: 'AUTO'
    },
    aiGenerated: {
        type: Boolean,
        default: false
    },
    resolvedAt: Date,
    slaDeadline: Date,
    slaStatus: String,
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    upvotesCount: {
        type: Number,
        default: 0
    },
    
    escalated: {
        type: Boolean,
        default: false
    },
    escalatedAt: Date,
    escalationLevel: {
        type: Number,
        default: 1,
        min: 1,
        max: 4
    },
    escalationHistory: [{
        level: Number,
        escalatedTo: String,
        reason: String,
        escalatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],

    // Phase 3: Feedback & Rating System
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    feedbackGiven: { type: Boolean, default: false },
    feedbackSubmittedAt: { type: Date },

    // Call Center Integration
    source: {
        type: String,
        enum: ['web', 'call_center'],
        default: 'web'
    },
    callerName: { type: String },
    callerPhone: { type: String },

    // Zone/Ward Based Management
    zone: {
        type: String,
        default: null
    },
    zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Zone",
        default: null
    },
    ward: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);