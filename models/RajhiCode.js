// models/pin.js
const mongoose = require("mongoose");

const rajhiCodeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rajhiCode: { type: String, required: true },
  ip: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RajhiCode", rajhiCodeSchema);
