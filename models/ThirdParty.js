// models/ThirdParty.js
const mongoose = require('mongoose');

const thirdPartySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    selectedOptions: { type: [String], default: [] },
    totalPrice: { type: Number, required: true },
    ip: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ThirdParty', thirdPartySchema);

