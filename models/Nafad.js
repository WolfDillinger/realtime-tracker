const mongoose = require('mongoose');

const NafadSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },  // store hashed or be careful in production
    time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Nafad', NafadSchema);
