
// models/Visit.js
const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    page: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', visitSchema);