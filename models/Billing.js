const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mada: { type: Boolean, default: false },
    visa_mastarcard: { type: Boolean, default: false },
    applepay: { type: Boolean, default: false },
    totalPrice: { type: Number, required: true },
    ip: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Billing', billingSchema);