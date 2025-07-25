// models/NafadCode.js
const mongoose = require('mongoose');

const nafadCodeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    ip: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NafadCode', nafadCodeSchema);