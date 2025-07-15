// models/phone.js
const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phoneNumber: { type: String, required: true },
    operator: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('phone', phoneSchema);