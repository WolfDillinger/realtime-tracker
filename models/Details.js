const mongoose = require('mongoose');

const detailsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    TypeOfInsuranceContract: { type: String, required: true },
    InsuranceStartDate: { type: Date, required: true },
    PurposeOfUse: { type: String, required: true },
    EstimatedValue: { type: Number, required: true },
    ManufactureYear: { type: String, required: true },
    RepairLocation: { type: String, required: true },
    ip: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Details', detailsSchema);