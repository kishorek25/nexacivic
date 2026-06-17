const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    ward: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    boundaries: {
        type: {
            type: String,
            enum: ['Polygon', 'Circle', 'Point'],
            default: 'Polygon'
        },
        coordinates: [{
            type: Number
        }]
    },
    centerLat: {
        type: Number
    },
    centerLng: {
        type: Number
    },
    radius: {
        type: Number,
        default: 1000
    },
    assignedStaff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    color: {
        type: String,
        default: '#4f46e5'
    },
    stats: {
        totalComplaints: { type: Number, default: 0 },
        resolvedComplaints: { type: Number, default: 0 },
        pendingComplaints: { type: Number, default: 0 }
    }
}, { timestamps: true });

zoneSchema.index({ name: 1 });
zoneSchema.index({ ward: 1 });
zoneSchema.index({ centerLat: 1, centerLng: 1 });

module.exports = mongoose.model("Zone", zoneSchema);
