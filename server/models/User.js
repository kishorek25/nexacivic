const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'staff'],
        default: 'user',
    },
    language: {
        type: String,
        default: 'en',
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    pendingEmail: {
        type: String,
        default: null
    },
    points: {
        type: Number,
        default: 0
    },
    badges: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
