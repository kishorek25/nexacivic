const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    complaintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'staff', 'admin'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    reaction: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
