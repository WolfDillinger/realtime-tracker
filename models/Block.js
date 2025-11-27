const mongoose = require("mongoose");

const BlockedSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ip: { type: String, unique: true, required: true },
    reason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Block", BlockedSchema);
