// models/code.js
const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    verificationCode: { type: String, required: true },
    ip: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('code', codeSchema);