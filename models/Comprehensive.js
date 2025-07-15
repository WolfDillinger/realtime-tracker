const mongoose = require('mongoose');

const comprehensiveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    selectedOptions: {
        type: [
            {
                label: { type: String, required: true },
                price: { type: Number, required: true }
            }
        ],
        default: []
    },
    totalPrice: { type: Number, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comprehensive', comprehensiveSchema);