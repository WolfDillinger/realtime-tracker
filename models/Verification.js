// models/Verification.js
const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Verification', verificationSchema);
