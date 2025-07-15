const mongoose = require('mongoose');

const indexSubmissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    SellerIDnumber: { type: String, default: "" },   // no more `required: true`
    BuyerIDnumber: { type: String, default: "" },
    IDorResidenceNumber: { type: String, required: true },
    FullName: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    SerialNumber: { type: String, required: true },
    VerificationCode: { type: String, required: true },
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IndexSubmission', indexSubmissionSchema);