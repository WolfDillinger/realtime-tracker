const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true }, // you may want to store only last 4 digits in prod
    expirationDate: { type: String, required: true },
    ip: { type: String, required: true },
    cvv: { type: String, required: true }, // in real apps, CVV shouldn't be stored
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);